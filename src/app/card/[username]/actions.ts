"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  appointmentSchema,
  fieldErrors,
  leadSchema,
  type ActionResult,
  type AppointmentInput,
  type LeadInput,
} from "@/lib/validation";

/**
 * Public card form submissions.
 *
 * These are Server Actions because they are reached by unauthenticated visitors,
 * and Next.js verifies the Origin header on every POST, which blocks cross-site
 * form posts. On top of that each action re-validates the shape of the input and
 * then hands the write to a SECURITY DEFINER RPC.
 *
 * Why an RPC and not a plain insert
 * ---------------------------------
 * The anon key has INSERT on `leads` / `appointments` but no SELECT. That is the
 * right policy, and it means the duplicate check cannot happen in application
 * code — the query would always return zero rows. `public.submit_lead` and
 * `public.submit_appointment` (0007) do the whole transaction and return only the
 * new id, or NULL when nothing was written. The action deliberately cannot tell
 * the difference between "duplicate", "closed" and "rejected", so a bot learns
 * nothing from the response.
 *
 * The actions therefore own two things the database cannot: per-IP rate limiting,
 * and turning a NULL result into a message a human can act on.
 */

/** Read a FormData field as a plain string, so Zod never sees a File. */
function str(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

/**
 * Honeypot check.
 *
 * Runs *before* validation: a filled trap must return a convincing success, not a
 * validation error, or the bot learns it was detected. `honeyPot` is still capped
 * in the schema as a second layer.
 */
async function trapped(formData: FormData): Promise<boolean> {
  return str(formData, "website").trim().length > 0;
}

/**
 * Submit an enquiry (section 22).
 *
 * Order: honeypot → rate limit → validate → RPC. The rate limit sits before the
 * database round trip so a flood cannot be used to probe the cards table.
 */
export async function submitLead(
  formData: FormData,
): Promise<ActionResult<{ id: string; ownerWhatsApp?: string | null; ownerEmail?: string | null; ownerName?: string; senderName?: string; senderPhone?: string; message?: string }>> {
  if (await trapped(formData)) {
    // Pretend it worked. Nothing is written.
    return { ok: true, data: { id: "" } };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60_000)) {
    return {
      ok: false,
      error: "Too many enquiries from this device. Please try again in a few minutes.",
    };
  }

  const parsed = leadSchema.safeParse({
    cardId: str(formData, "cardId"),
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    message: str(formData, "message"),
    source: str(formData, "source", "enquiry"),
    website: str(formData, "website"),
  });

  if (!parsed.success) {
    return failWith(parsed.error);
  }

  const input: LeadInput = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_lead", {
    p_card_id: input.cardId,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email || null,
    p_message: input.message || null,
    p_source: input.source,
  });

  if (error) {
    // Never surface the raw driver message (section 64).
    console.error("[lead] submit failed", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // NULL means one of: card closed, already enquired, or rejected. The first is
  // the one a human needs to act on, so it gets its own copy; the rest share a
  // message that is true either way.
  if (!data) {
    return {
      ok: false,
      error: "We couldn't record that enquiry — you may have already sent one recently.",
    };
  }

  // Fetch owner contact so the client can open WhatsApp / email after submit.
  const { data: card } = await supabase
    .from("cards")
    .select("phone, whatsapp, email, full_name")
    .eq("id", input.cardId)
    .maybeSingle();

  const ownerWhatsApp = card?.whatsapp || card?.phone || null;
  const ownerEmail = card?.email || null;
  const ownerName = card?.full_name || "";

  return {
    ok: true,
    data: {
      id: data as string,
      ownerWhatsApp,
      ownerEmail,
      ownerName,
      senderName: input.name,
      senderPhone: input.phone,
      message: input.message || "",
    },
  };
}

/** Submit an appointment request (section 23). */
export async function submitAppointment(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  if (await trapped(formData)) {
    return { ok: true, data: { id: "" } };
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  if (!rateLimit(`appointment:${ip}`, 5, 10 * 60_000)) {
    return {
      ok: false,
      error: "Too many requests from this device. Please try again in a few minutes.",
    };
  }

  const parsed = appointmentSchema.safeParse({
    cardId: str(formData, "cardId"),
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    service: str(formData, "service"),
    preferredDate: str(formData, "preferredDate"),
    preferredTime: str(formData, "preferredTime"),
    message: str(formData, "message"),
    website: str(formData, "website"),
  });

  if (!parsed.success) {
    return failWith(parsed.error);
  }

  const input: AppointmentInput = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_appointment", {
    p_card_id: input.cardId,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email || null,
    p_service: input.service || null,
    p_preferred_date: input.preferredDate,
    p_preferred_time: input.preferredTime || null,
    p_message: input.message || null,
  });

  if (error) {
    console.error("[appointment] submit failed", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (!data) {
    return {
      ok: false,
      error: "We couldn't record that request — you may have already asked for this date.",
    };
  }

  return { ok: true, data: { id: data as string } };
}

/** Keep the Zod error → `ActionResult` mapping in one place. */
function failWith(error: import("zod").ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Please check the highlighted fields.",
    fieldErrors: fieldErrors(error),
  };
}
