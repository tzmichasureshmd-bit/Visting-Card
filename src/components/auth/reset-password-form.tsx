"use client";

import { motion } from "motion/react";
import { useActionState } from "react";

import { updatePasswordAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/validation";
import { rise, stagger } from "@/components/auth/auth-variants";
import {
  AuthFeedback,
  AuthFormError,
  AuthPasswordInput,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import { RESET_SUCCESS_BODY, RESET_SUCCESS_TITLE } from "@/lib/auth/messages";

/**
 * New-password form.
 *
 * Reached only after `/auth/callback/reset` has exchanged the emailed token and
 * established a recovery session; if the user navigates here directly the route
 * renders the expired-link state instead of this form.
 */

type State = ActionResult<{ updated: true }> | null;

export function ResetPasswordForm({ isDark }: { isDark: boolean }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updatePasswordAction,
    null,
  );

  const heading = isDark ? "text-white" : "text-[#0f1729]";
  const sub = isDark ? "text-white/65" : "text-[#4b5565]";

  if (state?.ok) {
    return (
      <AuthFeedback
        isDark={isDark}
        title={RESET_SUCCESS_TITLE}
        body={RESET_SUCCESS_BODY}
        actionLabel="Back to Login"
        actionHref="/login"
      />
    );
  }

  return (
    <motion.div variants={stagger()} initial="hidden" animate="show">
      <motion.div variants={rise}>
        <h1 className={`text-xl font-semibold tracking-tight ${heading}`}>Reset Password</h1>
        <p className={`mt-1.5 text-[13.5px] leading-relaxed ${sub}`}>
          Choose a new password for your account.
        </p>
      </motion.div>

      <motion.form variants={rise} action={formAction} noValidate className="mt-6 space-y-4">
        <AuthFormError isDark={isDark} message={state && !state.ok ? state.error : undefined} />

        <AuthPasswordInput
          isDark={isDark}
          name="password"
          label="New Password"
          required
          autoCompleteToken="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters."
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

        <AuthSubmitButton pending={pending}>
          {pending ? "Updating password..." : "Update Password"}
        </AuthSubmitButton>
      </motion.form>
    </motion.div>
  );
}

/** Shown when the recovery session is missing or has expired. */
export function ResetExpired({ isDark }: { isDark: boolean }) {
  return (
    <AuthFeedback
      isDark={isDark}
      tone="warning"
      title="This link is no longer valid"
      body="Reset links expire after an hour and can only be used once. Request a new one to continue."
      actionLabel="Request a new link"
      actionHref="/forgot-password"
    />
  );
}
