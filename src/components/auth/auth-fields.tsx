"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useId } from "react";

export const AUTH_PRIMARY_ACTION = "dv-btn dv-btn-primary";

interface FieldBase {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

function omitFieldProps(props: FieldBase & Record<string, unknown>) {
  const rest: Record<string, unknown> = { ...props };
  for (const key of ["label", "hint", "error", "className", "id", "isDark", "autoCompleteToken"] as const) {
    delete rest[key];
  }
  return rest;
}

function AuthLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--dv-black)", marginBottom: "0.5rem" }}>
      {children}
    </label>
  );
}

function AuthFieldMsg({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) return <p id={`${id}-error`} role="alert" style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--dv-danger)" }}>{error}</p>;
  if (hint) return <p id={`${id}-hint`} style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>{hint}</p>;
  return null;
}

export function AuthEmailInput({ isDark, ...props }: FieldBase & React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean }) {
  void isDark;
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const describedBy = props.error ? `${fieldId}-error` : props.hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={props.className} style={{ marginBottom: "1.25rem" }}>
      {props.label ? <AuthLabel htmlFor={fieldId}>{props.label}</AuthLabel> : null}
      <input {...omitFieldProps(props)} id={fieldId} type="email" inputMode="email" autoComplete="email" spellCheck={false}
        aria-invalid={props.error ? true : undefined} aria-describedby={describedBy} className="dv-auth-input" />
      <AuthFieldMsg id={fieldId} hint={props.hint} error={props.error} />
    </div>
  );
}

export function AuthTextInput({ isDark, ...props }: FieldBase & React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean }) {
  void isDark;
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const describedBy = props.error ? `${fieldId}-error` : props.hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={props.className} style={{ marginBottom: "1.25rem" }}>
      {props.label ? <AuthLabel htmlFor={fieldId}>{props.label}</AuthLabel> : null}
      <input {...omitFieldProps(props)} id={fieldId} type="text" autoComplete="name"
        aria-invalid={props.error ? true : undefined} aria-describedby={describedBy} className="dv-auth-input" />
      <AuthFieldMsg id={fieldId} hint={props.hint} error={props.error} />
    </div>
  );
}

export function AuthInput({ isDark, ...props }: FieldBase & React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean }) {
  void isDark;
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const describedBy = props.error ? `${fieldId}-error` : props.hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={props.className} style={{ marginBottom: "1.25rem" }}>
      {props.label ? <AuthLabel htmlFor={fieldId}>{props.label}</AuthLabel> : null}
      <input {...omitFieldProps(props)} id={fieldId}
        aria-invalid={props.error ? true : undefined} aria-describedby={describedBy} className="dv-auth-input" />
      <AuthFieldMsg id={fieldId} hint={props.hint} error={props.error} />
    </div>
  );
}

export function AuthPasswordInput({ isDark, autoCompleteToken, ...props }: FieldBase & React.InputHTMLAttributes<HTMLInputElement> & { isDark: boolean; autoCompleteToken?: "current-password" | "new-password" }) {
  void isDark;
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const describedBy = [props.error ? `${fieldId}-error` : null, props.hint ? `${fieldId}-hint` : null].filter(Boolean).join(" ").trim() || undefined;
  return (
    <div className={props.className} style={{ marginBottom: "1.25rem" }}>
      {props.label ? <AuthLabel htmlFor={fieldId}>{props.label}</AuthLabel> : null}
      <div style={{ position: "relative" }}>
        <input {...omitFieldProps(props)} id={fieldId} type={visible ? "text" : "password"} autoComplete={autoCompleteToken ?? "current-password"}
          aria-invalid={props.error ? true : undefined} aria-describedby={describedBy}
          className="dv-auth-input" style={{ paddingRight: "3rem" }} />
        <span
          role="button"
          tabIndex={0}
          onClick={() => setVisible((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setVisible((v) => !v);
            }
          }}
          aria-pressed={visible}
          aria-controls={fieldId}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{ position: "absolute", inset: "0 0 0 auto", width: "3rem", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--dv-gray-light)" }}
        >
          {visible ? <EyeOff style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden /> : <Eye style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />}
        </span>
      </div>
      <AuthFieldMsg id={fieldId} hint={props.hint} error={props.error} />
    </div>
  );
}

export function AuthSubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending}
      className="dv-btn dv-btn-primary"
      style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
      {pending ? (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden style={{ animation: "spin 1s linear infinite", width: "1rem", height: "1rem" }}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

export function AuthFormError({ isDark, message }: { isDark: boolean; message?: string }) {
  void isDark;
  if (!message) return null;
  return (
    <p role="alert" style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.875rem 1rem", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--dv-r-sm)", fontSize: "0.875rem", color: "var(--dv-danger)", marginBottom: "1rem" }}>
      {message}
    </p>
  );
}

export function AuthFeedback({ isDark, tone = "success", title, body, actionLabel, actionHref }: {
  isDark: boolean; tone?: "success" | "warning"; title: string; body: string; actionLabel: string; actionHref: string;
}) {
  void isDark;
  const isSuccess = tone === "success";
  return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: isSuccess ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: isSuccess ? "var(--dv-success)" : "var(--dv-warning)" }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: "1.5rem", height: "1.5rem" }} strokeWidth="2.2">
          {isSuccess ? <path d="m5 13 4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M12 8v5m0 3.5v.5" stroke="currentColor" strokeLinecap="round" />}
          {!isSuccess && <circle cx="12" cy="12" r="9" stroke="currentColor" />}
        </svg>
      </div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--dv-black)" }}>{title}</h1>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.6 }}>{body}</p>
      <a href={actionHref} className="dv-btn dv-btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>{actionLabel}</a>
    </div>
  );
}

export function AuthSwitch({ isDark, prompt, actionLabel, actionHref }: {
  isDark: boolean; prompt: string; actionLabel: string; actionHref: string;
}) {
  void isDark;
  return (
    <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--dv-gray)", marginTop: "1.25rem" }}>
      {prompt}{" "}
      <a href={actionHref} style={{ color: "var(--dv-black)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}>{actionLabel}</a>
    </p>
  );
}
