"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Info, Loader2, Lock, Mail } from "lucide-react";
import { Field } from "./Field";
import { GoogleIcon } from "./GoogleIcon";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { validateEmail } from "@/lib/validation";

/** Log-in form — DEMONSTRATION BEHAVIOR. Authentication is not connected yet. */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next = { email: validateEmail(email), password: password ? null : "Enter your password." };
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    setPassword(""); // never retained
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setNotice("Sign-in isn't connected in this preview, so no account was checked. You can explore the dashboard with sample data.");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        ref={emailRef}
        label="Email address"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        icon={<Mail className="size-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={submitting}
        required
      />
      <Field
        ref={passwordRef}
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        icon={<Lock className="size-4" />}
        revealable
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={submitting}
        required
        trailingLabel={
          <button
            type="button"
            onClick={() => setNotice("Password recovery will be available when authentication launches.")}
            className="text-[12.5px] font-medium text-muted transition-colors hover:text-fg"
          >
            Forgot password?
          </button>
        }
      />

      <button type="submit" disabled={submitting} aria-busy={submitting} className={`${btnPrimary} h-12 w-full text-[15px]`}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Log In
            <ArrowRight className="size-4" />
          </>
        )}
      </button>

      {notice && (
        <div role="status" className="flex gap-3 rounded-[10px] border border-line bg-surface p-4 text-[13.5px] leading-relaxed text-muted animate-rise">
          <Info className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden="true" />
          <div>
            {notice}
            <Link href="/dashboard" className="mt-2 flex items-center gap-1 font-semibold text-fg hover:underline underline-offset-4">
              Open dashboard preview <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 py-0.5" aria-hidden="true">
        <span className="h-px flex-1 bg-line-soft" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">or</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <button
        type="button"
        onClick={() => setNotice("Google sign-in will be available when authentication launches. Nothing was sent.")}
        className={`${btnSecondary} h-12 w-full text-[14.5px]`}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="pt-1 text-center text-[14px] text-muted">
        New to Globe?{" "}
        <Link href="/#register" className="font-semibold text-fg underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
