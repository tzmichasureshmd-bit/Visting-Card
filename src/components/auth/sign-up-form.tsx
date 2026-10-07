"use client";

import { Check, Palette } from "lucide-react";
import { useActionState } from "react";

import { signUpAction } from "@/lib/auth/actions";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import type { PlanTier } from "@/lib/marketing/pricing";
import type { ActionResult, PlanSlug } from "@/lib/validation";
import { useAuthRedirect } from "@/components/auth/use-auth-redirect";
import {
  AuthEmailInput,
  AuthFeedback,
  AuthFormError,
  AuthPasswordInput,
  AuthSubmitButton,
  AuthSwitch,
  AuthTextInput,
} from "@/components/auth/auth-fields";

/**
 * Registration form.
 *
 * Four fields only. The database trigger creates the `profiles`, `subscriptions`
 * and `referral_wallets` rows from `raw_user_meta_data`, so anything beyond name,
 * email and password belongs in the onboarding flow rather than here — the brief
 * asks not to duplicate onboarding fields, and this form deliberately does not.
 *
 * When Supabase has email confirmation on there is no session yet, so the action
 * reports `verificationSent` and this component shows the "check your inbox"
 * state instead of navigating.
 */

const MIN_PASSWORD = 8;

type SignUpState = ActionResult<{ verificationSent: boolean; redirectTo?: string }> | null;

/** How each plan reads in the signup confirmation line. */
const PLAN_LABELS: Record<PlanSlug, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function SignUpForm({
  isDark,
  referralCode,
  themeSlug,
  theme,
  planSlug,
  planTier,
}: {
  isDark: boolean;
  referralCode: string;
  themeSlug: string;
  theme: ThemeShowcase | null;
  planSlug: PlanSlug;
  planTier?: PlanTier | null;
}) {
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(signUpAction, null);
  useAuthRedirect(state, pending);

  const heading = isDark ? "text-white" : "text-[#0f1729]";
  const sub = isDark ? "text-white/65" : "text-[#4b5565]";
  const link = isDark ? "text-white" : "text-[#3730a3]";
  const step = isDark ? "text-[#a5b4fc]" : "text-[#4f46e5]";
  const error = state && !state.ok ? state.error : undefined;

  if (state?.ok && state.data.verificationSent) {
    return (
      <AuthFeedback
        isDark={isDark}
        title="Confirm your email"
        body="We sent a confirmation link. Open it to activate your card."
        actionLabel="Back to Sign In"
        actionHref="/login"
      />
    );
  }

  return (
    <div>
      <div>
        <p className={`text-[11.5px] font-semibold uppercase tracking-[0.14em] ${step}`}>
          Step 1 of 2 · Your account
        </p>
        <h1 className={`mt-1.5 text-xl font-semibold tracking-tight ${heading}`}>
          Create your Digital Visiting Card
        </h1>
        <p className={`mt-1.5 text-[13.5px] leading-relaxed ${sub}`}>
          Start free. No card needed.
        </p>
      </div>

      <form action={formAction} noValidate className="mt-6 space-y-4">
        <AuthFormError isDark={isDark} message={error} />

        <AuthTextInput
          isDark={isDark}
          name="fullName"
          label="Name"
          required
          placeholder="Your full name"
          error={state && !state.ok ? state.fieldErrors?.fullName : undefined}
        />

        <AuthEmailInput
          isDark={isDark}
          name="email"
          label="Email"
          required
          placeholder="you@example.com"
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
        />

        <AuthPasswordInput
          isDark={isDark}
          name="password"
          label="Password"
          required
          autoCompleteToken="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          hint={`Use at least ${MIN_PASSWORD} characters.`}
          error={state && !state.ok ? state.fieldErrors?.password : undefined}
        />

        <AuthPasswordInput
          isDark={isDark}
          name="confirmPassword"
          label="Confirm Password"
          required
          autoCompleteToken="new-password"
          placeholder="Type it once more"
          error={state && !state.ok ? state.fieldErrors?.confirmPassword : undefined}
        />

        {/* Referral attribution is resolved from signed-up metadata by the
            database trigger, which reads `referral_code`. The chosen design
            travels the same way — the action copies it into user metadata so it
            survives the email-verification hop. */}
        <input type="hidden" name="referralCode" value={referralCode} />
        <input type="hidden" name="theme" value={themeSlug} />
        <input type="hidden" name="plan" value={planSlug} />

        {/* Selected plan summary card */}
        {planSlug !== "free" && planTier ? (
          <div
            style={{
              borderRadius: "var(--dv-r-md)",
              border: `2px solid ${isDark ? "rgba(163,230,53,0.5)" : "rgba(0,0,0,0.18)"}`,
              background: isDark ? "rgba(163,230,53,0.07)" : "#f9fafb",
              padding: "1rem 1.125rem",
              marginBottom: "0.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(163,230,53,0.9)" : "#16a34a" }}>
                Selected plan
              </span>
              <span style={{ fontSize: "1.125rem", fontWeight: 900, letterSpacing: "-0.03em", color: isDark ? "#fff" : "var(--dv-black)" }}>
                {planTier.price}
                {planTier.period ? <span style={{ fontSize: "0.75rem", fontWeight: 500, opacity: 0.55, marginLeft: "0.25rem" }}>{planTier.period}</span> : null}
              </span>
            </div>
            <p style={{ margin: "0 0 0.625rem", fontSize: "0.9375rem", fontWeight: 700, color: isDark ? "#fff" : "var(--dv-black)" }}>
              {PLAN_LABELS[planSlug]}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.625rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {planTier.features.slice(0, 4).map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}>
                  <Check style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0, color: isDark ? "rgba(163,230,53,0.9)" : "#16a34a" }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <p style={{ margin: 0, fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.45)" : "#6b7280" }}>
              Your account starts on Free — upgrade from the dashboard once your card is live.
            </p>
          </div>
        ) : null}

        {theme ? (
          <p
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] ${isDark ? "border-white/14 bg-white/8 text-white/70" : "border-black/10 bg-black/5 text-[#4b5565]"}`}
          >
            <Palette className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Starting from{" "}
              <strong className={`font-semibold ${isDark ? "text-white" : "text-[#0f1729]"}`}>
                {theme.name}
              </strong>
              {theme.isPremium ? (
                <>
                  {" "}
                  <span className={isDark ? "text-white/60" : "text-[#92400e]"}>
                    (Pro style)
                  </span>
                </>
              ) : null}
              . You can change it any time.
            </span>
          </p>
        ) : null}

        <AuthSubmitButton pending={pending}>
          {pending ? "Creating account..." : "Create Account"}
        </AuthSubmitButton>

        <p className={`text-center text-[12.5px] leading-relaxed ${sub}`}>
          By creating an account you agree to our{" "}
          <a href="/legal/terms" className={`underline underline-offset-2 ${link}`}>
            Terms
          </a>{" "}
          and{" "}
          <a href="/legal/privacy" className={`underline underline-offset-2 ${link}`}>
            Privacy Policy
          </a>
          .
        </p>

        <AuthSwitch
          isDark={isDark}
          prompt="Already have an account?"
          actionLabel="Sign In"
          actionHref="/login"
        />
      </form>
    </div>
  );
}
