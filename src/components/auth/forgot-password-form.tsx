"use client";

import { motion } from "motion/react";
import { useActionState } from "react";

import { forgotPasswordAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/validation";
import { rise, stagger } from "@/components/auth/auth-variants";
import {
  AuthEmailInput,
  AuthFeedback,
  AuthFormError,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import { FORGOT_SENT_BODY, FORGOT_SENT_TITLE } from "@/lib/auth/messages";

/**
 * "Forgot password" request form.
 *
 * Deliberately one field. After a successful request the component shows a
 * confirmation and never reveals whether the address was registered — otherwise
 * this page becomes a way to enumerate accounts.
 */

type State = ActionResult<{ sent: true }> | null;

export function ForgotPasswordForm({ isDark }: { isDark: boolean }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    forgotPasswordAction,
    null,
  );

  const heading = isDark ? "text-white" : "text-[#0f1729]";
  const sub = isDark ? "text-white/65" : "text-[#4b5565]";
  const link = isDark ? "text-white" : "text-[#3730a3]";

  if (state?.ok) {
    return (
      <AuthFeedback
        isDark={isDark}
        title={FORGOT_SENT_TITLE}
        body={FORGOT_SENT_BODY}
        actionLabel="Back to Sign In"
        actionHref="/login"
      />
    );
  }

  return (
    <motion.div variants={stagger()} initial="hidden" animate="show">
      <motion.div variants={rise}>
        <h1 className={`text-xl font-semibold tracking-tight ${heading}`}>Forgot Password?</h1>
        <p className={`mt-1.5 text-[13.5px] leading-relaxed ${sub}`}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </motion.div>

      <motion.form variants={rise} action={formAction} noValidate className="mt-6 space-y-4">
        <AuthFormError
          isDark={isDark}
          message={state && !state.ok ? state.error : undefined}
        />

        <AuthEmailInput
          isDark={isDark}
          name="email"
          label="Email"
          required
          placeholder="you@example.com"
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
        />

        <AuthSubmitButton pending={pending}>
          {pending ? "Sending link..." : "Send Reset Link"}
        </AuthSubmitButton>

        <p className={`text-center text-[13px] ${sub}`}>
          Remembered it?{" "}
          <a
            href="/login"
            className={`font-semibold underline underline-offset-4 transition-all duration-150 hover:underline-offset-2 hover:opacity-75 ${link}`}
          >
            Back to Login
          </a>
        </p>
      </motion.form>
    </motion.div>
  );
}
