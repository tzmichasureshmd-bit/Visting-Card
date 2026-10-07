import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isDarkMode } from "@/lib/auth/theme";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your Digital Visiting Card account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const isDark = await isDarkMode();

  return (
    <AuthShell variant="forgot" isDark={isDark} showTagline={false}>
      <ForgotPasswordForm isDark={isDark} />
    </AuthShell>
  );
}
