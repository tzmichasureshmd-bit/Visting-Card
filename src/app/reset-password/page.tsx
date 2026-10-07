import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetExpired, ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import { isDarkMode } from "@/lib/auth/theme";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your Digital Visiting Card account.",
  robots: { index: false, follow: false },
};

/**
 * New-password form.
 *
 * The recovery token is exchanged server-side by `/auth/callback/reset`, which
 * leaves a recovery session in cookies. So by the time this route renders there
 * are two possibilities: an active recovery session, or none. Reaching this URL
 * directly without one shows the expired-link state rather than a form that would
 * fail on submit.
 *
 * Reading cookies makes this route dynamic, which is correct — it must never be
 * prerendered.
 */
export default async function ResetPasswordPage() {
  const isDark = await isDarkMode();

  let hasRecoverySession = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    hasRecoverySession = Boolean(data.user);
  } catch {
    // Supabase not configured, or unreachable. Treat as "no session" so the page
    // degrades to the expired-link state instead of throwing.
    hasRecoverySession = false;
  }

  return (
    <AuthShell variant="reset" isDark={isDark} showTagline={false}>
      {hasRecoverySession ? <ResetPasswordForm isDark={isDark} /> : <ResetExpired isDark={isDark} />}
    </AuthShell>
  );
}
