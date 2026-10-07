"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useActionState } from "react";

import { signInAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/validation";
import { useAuthRedirect } from "@/components/auth/use-auth-redirect";
import { rise, stagger } from "@/components/auth/auth-variants";
import {
  AuthEmailInput,
  AuthFormError,
  AuthPasswordInput,
  AuthSubmitButton,
  AuthSwitch,
} from "@/components/auth/auth-fields";

/**
 * Sign-in form.
 *
 * Client Component: `useActionState` owns submission, the pending label and the
 * inline error, so the page itself stays a Server Component.
 *
 * Content is exactly what the brief lists — heading, email, password, forgot
 * link, login, create account — and nothing else. There is no divider because
 * there is no second sign-in method to divide.
 */

export function SignInForm({ isDark }: { isDark: boolean }) {
  const router = useRouter();
  // The state type is `… | null` because that is the initial value; the action's
  // own `_prev` parameter matches it.
  const [state, formAction, pending] = useActionState<
    ActionResult<{ redirectTo: string }> | null,
    FormData
  >(signInAction, null);
  useAuthRedirect(state, pending);

  const heading = isDark ? "text-white" : "text-[#0f1729]";
  const sub = isDark ? "text-white/65" : "text-[#4b5565]";
  const link = isDark ? "text-white" : "text-[#3730a3]";

  return (
    <motion.div variants={stagger()} initial="hidden" animate="show">
      <motion.div variants={rise}>
        <h1 className={`text-xl font-semibold tracking-tight ${heading}`}>Welcome Back</h1>
        <p className={`mt-1.5 text-[13.5px] leading-relaxed ${sub}`}>Sign in to continue.</p>
      </motion.div>

      <motion.form
        variants={rise}
        action={formAction}
        noValidate
        className="mt-6 space-y-4"
      >
        <AuthFormError isDark={isDark} message={state && !state.ok ? state.error : undefined} />

        <AuthEmailInput
          isDark={isDark}
          name="email"
          label="Email"
          required
          placeholder="you@example.com"
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
        />

        <div>
          <AuthPasswordInput
            isDark={isDark}
            name="password"
            label="Password"
            required
            autoCompleteToken="current-password"
            placeholder="Your password"
            error={state && !state.ok ? state.fieldErrors?.password : undefined}
          />

          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className={`text-[13px] font-medium underline underline-offset-4 transition-all duration-150 hover:underline-offset-2 hover:opacity-75 ${link}`}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthSubmitButton pending={pending}>
          {pending ? "Signing in..." : "Login"}
        </AuthSubmitButton>

        {process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={() => { void router.push("/dashboard"); }}
            className={`w-full rounded-xl border py-2 text-[13px] font-medium transition-opacity hover:opacity-70 ${
              isDark ? "border-white/20 text-white/50" : "border-dashed border-gray-300 text-gray-400"
            }`}
          >
            ⚡ Dev skip → dashboard
          </button>
        )}

        <AuthSwitch
          isDark={isDark}
          prompt="New to Digital Visiting Cards?"
          actionLabel="Create Account"
          actionHref="/signup"
        />
      </motion.form>
    </motion.div>
  );
}
