"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  revealable?: boolean;
  trailingLabel?: ReactNode;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, error, hint, revealable, trailingLabel, type = "text", className = "", ...input },
  ref,
) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-[#e4e4e7]">
          {label}
        </label>
        {trailingLabel}
      </div>
      <div className="group relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a7a83] transition-colors duration-200 group-focus-within:text-fg">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={revealable && shown ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-[10px] border bg-input text-[14.5px] text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#76767f] hover:border-[#3d3d3d] focus:border-[#9a9a9a] focus:bg-[#191919] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.07)] focus-visible:outline-none ${
            icon ? "pl-10" : "pl-3.5"
          } ${revealable ? "pr-11" : "pr-3.5"} ${error ? "border-[#bdbdbd]" : "border-line"}`}
          {...input}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={shown}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#8a8a93] transition-colors hover:bg-hover hover:text-fg"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-fg animate-rise">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <div id={hintId} className="mt-2 text-[12.5px] text-muted">
          {hint}
        </div>
      )}
    </div>
  );
});
