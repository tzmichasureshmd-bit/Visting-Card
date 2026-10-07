import { z } from "zod";

import { SECTION_KEYS } from "@/lib/cards/types";
import { emailSchema } from "@/lib/validation";
import { safeUrl } from "@/lib/utils";

/**
 * Validation for card writes.
 *
 * Every server action that touches a card parses its input through the schemas
 * here first, so no raw string ever reaches the database. Messages are
 * user-facing wording shown verbatim in the UI (section 64).
 *
 * Phone numbers follow the same rule as the auth and lead schemas: optional on
 * a card, but when present they must be a real 10-digit Indian number — the
 * renderer hardcodes the `+91` prefix, so accepting anything else would produce
 * links that silently fail.
 */

/** Empty or a normalised 10-digit Indian number. */
const optionalPhone = z
  .string()
  .trim()
  .max(30, "Please enter a valid phone number.")
  .optional()
  .default("")
  .transform((raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    return digits;
  })
  .refine(
    (digits) => digits === "" || (digits.length === 10 && /^[6-9]/.test(digits)),
    "Please enter a valid 10-digit phone number.",
  );

const shortText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .default("");

/** Website accepts a bare domain ("dvcard.com") and normalises it to https. */
const website = z
  .string()
  .trim()
  .max(300, "That website address is too long.")
  .optional()
  .default("")
  .transform((value) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  })
  .refine((value) => value === "" || safeUrl(value) !== null, "Please enter a valid website address.");

/** Required website variant for content rows where the URL IS the button. */
const requiredUrl = z
  .string()
  .trim()
  .min(1, "Please enter a link.")
  .max(500, "That link is too long.")
  .transform((value) =>
    /^(https?:\/\/|mailto:|tel:)/i.test(value) ? value : `https://${value}`,
  )
  .refine((value) => /^(mailto:|tel:)/i.test(value) || safeUrl(value) !== null, "Please enter a valid link.");

const ctaType = z.enum(["whatsapp", "call", "website", "enquiry", "buy_now"]);

/**
 * The identity + contact form shared by onboarding (a subset, no cardId) and
 * the builder's "Your details" panel.
 */
export const cardBasicSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please use a shorter name."),
  designation: shortText(80, "That job title is too long."),
  company: shortText(120, "That company name is too long."),
  bio: shortText(600, "Please keep your introduction under 600 characters."),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: emailSchema,
  website,
  address: shortText(200, "That address is too long."),
  city: shortText(80, "Please use a shorter city name."),
  state: shortText(80, "Please use a shorter state name."),
  pincode: shortText(10, "That PIN code is too long."),
});

/**
 * Account settings.
 *
 * Deliberately tiny: `profiles` also carries `role`, `status`, `referral_code` and
 * `onboarded`, none of which a person should be able to set about themselves.
 */
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(120, "Please use a shorter name.")
    .optional()
    .default(""),
  phone: optionalPhone,
});

/** Onboarding step 2: the same shape minus the address fields and the card id. */
export const onboardingSchema = cardBasicSchema
  .pick({
    fullName: true,
    designation: true,
    bio: true,
    phone: true,
    whatsapp: true,
    city: true,
  })
  .extend({
    email: emailSchema.optional().default(""),
  });

/** Builder "Your details" also carries the card id and the public username. */
export const cardUpdateSchema = cardBasicSchema.extend({
  cardId: z.string().uuid("Invalid card reference."),
  username: z
    .string()
    .trim()
    .max(30, "Usernames can be at most 30 characters.")
    .optional()
    .default(""),
});

/* ── Content rows ──────────────────────────────────────────────────────────── */

export const socialRowSchema = z.object({
  platform: z
    .string()
    .trim()
    .max(30, "That platform name is too long.")
    .optional()
    .default("custom"),
  url: requiredUrl,
  label: shortText(60, "That label is too long."),
});
export type SocialRowInput = z.infer<typeof socialRowSchema>;

export const serviceRowSchema = z.object({
  name: z.string().trim().min(1, "Please name the service.").max(100, "That name is too long."),
  description: shortText(400, "Please keep the description under 400 characters."),
  pricePaise: z
    .number()
    .int("Please enter a whole rupee amount.")
    .min(0, "Price cannot be negative.")
    .max(10_000_000, "That price looks too large.")
    .nullable()
    .optional()
    .default(null),
  ctaType,
  ctaLabel: shortText(60, "That label is too long."),
  ctaValue: shortText(300, "That value is too long."),
});
export type ServiceRowInput = z.infer<typeof serviceRowSchema>;

export const productRowSchema = z
  .object({
    name: z.string().trim().min(1, "Please name the product.").max(100, "That name is too long."),
    description: shortText(400, "Please keep the description under 400 characters."),
    originalPrice: z
      .number()
      .int("Please enter a whole rupee amount.")
      .min(0, "Price cannot be negative.")
      .max(10_000_000, "That price looks too large.")
      .nullable()
      .optional()
      .default(null),
    salePrice: z
      .number()
      .int("Please enter a whole rupee amount.")
      .min(0, "Price cannot be negative.")
      .max(10_000_000, "That price looks too large.")
      .nullable()
      .optional()
      .default(null),
    ctaType: z.enum(["whatsapp", "buy_now", "website", "enquiry"]),
    ctaLabel: shortText(60, "That label is too long."),
    ctaValue: shortText(300, "That value is too long."),
  })
  .refine(
    (row) =>
      row.salePrice == null || row.originalPrice == null || row.salePrice <= row.originalPrice,
    { message: "Sale price must be at or below the original price.", path: ["salePrice"] },
  );
export type ProductRowInput = z.infer<typeof productRowSchema>;

export const paymentSchema = z.object({
  cardId: z.string().uuid("Invalid card reference."),
  upiId: shortText(100, "That UPI ID is too long."),
  payeeName: shortText(100, "That name is too long."),
  note: shortText(200, "Please keep the note under 200 characters."),
  isActive: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value) => value === true || value === "true"),
});

/** One row of the weekly hours grid. Times are "HH:MM" 24-hour strings. */
export const businessHourRowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  opensAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM.")
    .nullable()
    .optional()
    .default(null),
  closesAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM.")
    .nullable()
    .optional()
    .default(null),
  is24h: z.boolean().optional().default(false),
});
export type BusinessHourRowInput = z.infer<typeof businessHourRowSchema>;

/* ── Section toggles ───────────────────────────────────────────────────────── */

export const sectionKeySchema = z.enum(SECTION_KEYS);
export type SectionKeyInput = z.infer<typeof sectionKeySchema>;
