import { z } from "zod";

/**
 * Shared input validation.
 *
 * Every Server Action parses its FormData through these schemas before touching
 * the database, and returns the parsed values rather than the raw strings — so a
 * handler can never accidentally use unsanitised input (section 57).
 *
 * Messages are user-facing wording shown verbatim in the UI (section 64).
 */

/** Bare 10-digit Indian mobile, accepted in any formatting the user types. */
const phoneDigits = z
  .string()
  .trim()
  .min(1, "Please enter a phone number.")
  .transform((raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    return digits;
  })
  .refine((d) => d.length === 10, "Please enter a valid 10-digit phone number.")
  .refine((d) => /^[6-9]/.test(d), "Please enter a valid WhatsApp number.");

export const emailSchema = z
  .string()
  .trim()
  .max(254, "That email address is too long.")
  .refine(
    (value) => value === "" || /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value),
    "Please enter a valid email address.",
  );

/** Honeypot field — bots fill it, humans never see it. */
const honeyPot = z.string().max(0, "Submission rejected.").optional().or(z.literal(""));

export const leadSchema = z.object({
  cardId: z.string().uuid("Invalid card reference."),
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please use a shorter name."),
  phone: phoneDigits,
  email: emailSchema.optional().default(""),
  message: z
    .string()
    .trim()
    .max(2000, "Please keep your message under 2000 characters.")
    .optional()
    .default(""),
  source: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("enquiry"),
  // Website for honeypot.
  website: honeyPot,
});
export type LeadInput = z.infer<typeof leadSchema>;

export const appointmentSchema = z.object({
  cardId: z.string().uuid("Invalid card reference."),
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please use a shorter name."),
  phone: phoneDigits,
  email: emailSchema.optional().default(""),
  service: z.string().trim().max(120).optional().default(""),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date.")
    .refine((value) => {
      // Reject past dates without relying on the browser's date picker.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(`${value}T00:00:00`) >= today;
    }, "Please choose a date that is not in the past."),
  preferredTime: z.string().trim().max(20).optional().default(""),
  message: z
    .string()
    .trim()
    .max(2000, "Please keep your message under 2000 characters.")
    .optional()
    .default(""),
  website: honeyPot,
});
export type AppointmentInput = z.infer<typeof appointmentSchema>;

/** Sign-up. Supabase Auth enforces password strength; we only gate shape. */
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .refine((v) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v), "Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Please use at least 8 characters.")
    .max(200, "That password is too long."),
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please use a shorter name.")
    .optional()
    .default(""),
  phone: phoneDigits.optional().or(z.literal("")).default(""),
  referralCode: z.string().trim().max(40).optional().default(""),
});

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address."),
  password: z.string().min(1, "Please enter your password."),
});

/**
 * A theme slug arriving from a template CTA (`?theme=…`).
 *
 * Shape-checked only — a slug that passes here is still resolved against the
 * `themes` table before a card is pointed at it, so a guessed value can never
 * attach a style that is inactive, deleted, or does not exist. Returning `""`
 * rather than failing is deliberate: an unrecognised query string must not stop
 * someone registering, it should just start them on the default design.
 */
export const themeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,64}$/)
  .catch("");

/**
 * Read a slug out of a search param or `FormData` value, or `""`.
 *
 * Typed as `unknown` because the two callers hand it different shapes — a
 * `searchParams` entry can be `string | string[] | undefined` — and a repeated
 * query parameter (`?theme=a&theme=b`) is not worth treating differently from a
 * missing one.
 */
export function readThemeSlug(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  return themeSlugSchema.parse(raw);
}

/**
 * Plan slugs the pricing grid links with, as `?plan=`.
 *
 * Read the same forgiving way as the theme slug: the query string is a hint, not
 * an authorisation, so an unknown value falls back to `free` instead of failing
 * registration. The slug is only ever used to label the intent — no plan is
 * granted here, because that has to come from a confirmed subscription.
 */
export const planSlugSchema = z
  .enum(["free", "starter", "professional", "business", "enterprise"])
  .catch("free");

/** The five slugs the pricing grid can link with. */
export type PlanSlug = z.infer<typeof planSlugSchema>;

export function readPlanSlug(value: unknown): PlanSlug {
  const raw = typeof value === "string" ? value : "";
  return planSlugSchema.parse(raw);
}

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address."),
});

/** Flatten a Zod error into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}

/** Uniform failure shape returned by every action in the app. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}