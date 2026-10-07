import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isDarkMode } from "@/lib/auth/theme";
import { requireGuest } from "@/lib/auth/session";

/** Auth pages must never be indexed — they are thin wrappers around a form. */
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Digital Visiting Card account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? A login form is a dead end, so go where they were headed.
  await requireGuest("/dashboard");

  const isDark = await isDarkMode();

  return (
    <AuthShell variant="login" isDark={isDark}>
      {/* The form is a Client Component; the shell stays server-rendered. */}
      <Suspense fallback={null}>
        <SignInForm isDark={isDark} />
      </Suspense>
    </AuthShell>
  );
}
