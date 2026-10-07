import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { forwardRef, useId } from "react";

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input({ label, hint, error, required, className, id, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label htmlFor={fieldId} required={required}>{label}</Label> : null}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="dv-input"
        {...props}
      />
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea({ label, hint, error, required, className, id, rows = 4, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label htmlFor={fieldId} required={required}>{label}</Label> : null}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="dv-input"
        style={{ height: "auto", paddingTop: "0.75rem", paddingBottom: "0.75rem", resize: "vertical" }}
        {...props}
      />
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select({ label, hint, error, required, className, id, children, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label htmlFor={fieldId} required={required}>{label}</Label> : null}
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="dv-input"
        style={{ appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem", paddingRight: "2.5rem" }}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  );
});

export function Label({ htmlFor, children, required, className }: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("dv-label", className)}>
      {children}
      {required ? (
        <><span className="ml-0.5 text-red-500" aria-hidden>*</span><span className="sr-only"> (required)</span></>
      ) : null}
    </label>
  );
}

function FieldMessage({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--dv-danger)" }}>
        <AlertCircle style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} aria-hidden />
        <span>{error}</span>
      </p>
    );
  }
  if (hint) {
    return <p id={`${id}-hint`} style={{ fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>{hint}</p>;
  }
  return null;
}

export function Switch({ checked, onCheckedChange, label, description, disabled, id }: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 0" }}>
      <div>
        <label htmlFor={switchId} style={{ display: "block", fontSize: "0.9375rem", fontWeight: 500, color: "var(--dv-black)", cursor: "pointer" }}>{label}</label>
        {description ? <p style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--dv-gray)" }}>{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        style={{
          position: "relative",
          width: "2.75rem",
          height: "1.5rem",
          borderRadius: "999px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          background: checked ? "var(--dv-lime)" : "var(--dv-border-md)",
          transition: "background 0.2s",
          flexShrink: 0,
          marginTop: "0.125rem",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{
          position: "absolute",
          top: "0.125rem",
          left: checked ? "calc(100% - 1.375rem)" : "0.125rem",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
