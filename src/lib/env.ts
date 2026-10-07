/**
 * Typed, validated access to server-side environment variables.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so those must be
 * referenced as complete static expressions — hence the explicit object literal
 * below rather than a dynamic `process.env[key]` lookup.
 *
 * Values are resolved lazily. This means `next build` can still prerender purely
 * static routes (the landing page, legal pages) on a machine with no secrets,
 * while any route that actually touches the database fails loudly and
 * immediately with an actionable message rather than a cryptic `undefined`.
 */

import "server-only";

class MissingEnvError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}: ` +
        `${missing.join(", ")}.\n\n` +
        `Copy .env.example to .env.local and fill in the values, then restart the dev server.`,
    );
    this.name = "MissingEnvError";
  }
}

/**
 * Reads a variable, optionally marking it required.
 * Returns `undefined` when absent and not required.
 */
function read(key: string, required = false): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    if (required) {
      // Collected and reported together so a fresh clone only needs one fix.
      const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
      throw new MissingEnvError(missing.length ? missing : [key]);
    }
    return undefined;
  }
  return value;
}

/** Keys that must be present for the app to function at all. */
const REQUIRED_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Server-side configuration. Call the getters inside the request/runtime that
 * needs them rather than destructuring at module scope, so a missing secret
 * fails at the point of use.
 */
export const serverConfig = {
  get appUrl() {
    return read("NEXT_PUBLIC_APP_URL", true)!.replace(/\/+$/, "");
  },

  get supabaseUrl() {
    return read("NEXT_PUBLIC_SUPABASE_URL", true)!;
  },

  get supabaseAnonKey() {
    return read("NEXT_PUBLIC_SUPABASE_ANON_KEY", true)!;
  },

  /**
   * Bypasses Row Level Security. Only ever use this inside route handlers and
   * server actions that have already performed their own authorization check.
   */
  get serviceRoleKey() {
    return read("SUPABASE_SERVICE_ROLE_KEY", true)!;
  },

  get razorpayKeyId() {
    return read("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return read("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return read("RAZORPAY_WEBHOOK_SECRET");
  },

  /** True when Razorpay credentials exist; gates the upgrade UI. */
  get razorpayEnabled() {
    return Boolean(read("RAZORPAY_KEY_ID") && read("RAZORPAY_KEY_SECRET"));
  },

  /**
   * Bootstrap default only. The live values live in the `referral_config` table
   * so an admin can change them without a deploy (section 28/47).
   */
  get defaultReferralCommissionPercent() {
    return Number(read("DEFAULT_REFERRAL_COMMISSION_PERCENT") ?? "20");
  },
  get defaultReferralMinPayout() {
    return Number(read("DEFAULT_REFERRAL_MIN_PAYOUT") ?? "500");
  },

  get gracePeriodDays() {
    return Number(read("SUBSCRIPTION_GRACE_PERIOD_DAYS") ?? "14");
  },

  get cronSecret() {
    return read("CRON_SECRET");
  },

  /**
   * Salt for the analytics visitor hash. Set this to a long random string; it is
   * never sent to the browser. Changing it resets the "unique visitors" series,
   * which is the intended effect if it is ever rotated.
   */
  get analyticsSalt() {
    return read("ANALYTICS_SALT") ?? read("SUPABASE_SERVICE_ROLE_KEY") ?? "dvcard-dev-salt";
  },

  /** True when the Supabase credentials exist; used for graceful 503s. */
  get isSupabaseConfigured() {
    return isSupabaseConfigured();
  },
};

export { publicConfig } from "@/lib/public-config";