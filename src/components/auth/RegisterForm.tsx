"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Field } from "./Field";
import { GoogleIcon } from "./GoogleIcon";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import {
  passwordStrength,
  validateConfirm,
  validateEmail,
  validatePassword,
  type Strength,
} from "@/lib/validation";

type Errors = Partial<Record<"email" | "password" | "confirm" | "terms", string | null>>;

/**
 * Registration form — DEMONSTRATION BEHAVIOR.
 * No network request is made, nothing is stored, and passwords are cleared
 * from memory as soon as the form is submitted.
 */
export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const strength = passwordStrength(password, email);

  const validateAll = (): Errors => ({
    email: validateEmail(email),
    password: validatePassword(password, email),
    confirm: validateConfirm(password, confirm),
    terms: terms ? null : "Please accept the terms and conditions to continue.",
  });

  // Re-validate a field live once the user has left it at least once.
  const revalidate = (next: Partial<{ email: string; password: string; confirm: string; terms: boolean }>) => {
    const e = next.email ?? email;
    const p = next.password ?? password;
    const c = next.confirm ?? confirm;
    const t = next.terms ?? terms;
    setErrors((prev) => ({
      email: touched.email ? validateEmail(e) : prev.email,
      password: touched.password ? validatePassword(p, e) : prev.password,
      confirm: touched.confirm ? validateConfirm(p, c) : prev.confirm,
      terms: touched.terms ? (t ? null : prev.terms) : prev.terms,
    }));
  };

  const blur = (name: "email" | "password" | "confirm") => () => {
    setTouched((t) => ({ ...t, [name]: true }));
    const all = validateAll();
    // Don't nag about confirmation before the user has typed anything there.
    if (name === "confirm" && !confirm) return;
    setErrors((prev) => ({ ...prev, [name]: all[name] }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setNotice(null);
    const all = validateAll();
    setErrors(all);
    setTouched({ email: true, password: true, confirm: true, terms: true });

    const order = [
      ["email", emailRef],
      ["password", passwordRef],
      ["confirm", confirmRef],
      ["terms", termsRef],
    ] as const;
    const firstInvalid = order.find(([k]) => all[k]);
    if (firstInvalid) {
      firstInvalid[1].current?.focus();
      return;
    }

    setSubmitting(true);
    // Clear secrets immediately — this preview never sends or stores them.
    setPassword("");
    setConfirm("");
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setDone(true);
  };

  const reset = () => {
    setDone(false);
    setEmail("");
    setTerms(false);
    setErrors({});
    setTouched({});
    requestAnimationFrame(() => emailRef.current?.focus());
  };

  if (done) {
    return (
      <div className="animate-rise" role="status" aria-live="polite">
        <div className="mb-6 grid size-11 place-items-center rounded-full border border-line bg-surface">
          <Check className="size-5" />
        </div>
        <h2 className="text-[26px] font-semibold tracking-[-0.025em]">Preview complete.</h2>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
          Your details passed validation — but this is a demonstration build, so{" "}
          <span className="text-fg">no account was created</span>. Nothing was sent to a server, and your
          password was discarded immediately.
        </p>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
          Secure sign-up will be available when Globe&apos;s authentication service launches.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className={`${btnPrimary} h-11 text-[14px]`}>
            Explore the dashboard preview
            <ArrowRight className="size-4" />
          </Link>
          <button type="button" onClick={reset} className={`${btnSecondary} h-11 text-[14px]`}>
            Back to form
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby="register-demo-note" className="space-y-5">
      <Field
        ref={emailRef}
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        icon={<Mail className="size-4" />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          revalidate({ email: e.target.value });
        }}
        onBlur={blur("email")}
        error={errors.email}
        disabled={submitting}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field
          ref={passwordRef}
          label="Password"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<Lock className="size-4" />}
          revealable
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            revalidate({ password: e.target.value });
          }}
          onBlur={blur("password")}
          error={errors.password}
          disabled={submitting}
          required
        />
        <Field
          ref={confirmRef}
          label="Confirm password"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Repeat password"
          icon={<ShieldCheck className="size-4" />}
          revealable
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            revalidate({ confirm: e.target.value });
          }}
          onBlur={blur("confirm")}
          error={errors.confirm}
          disabled={submitting}
          required
        />
      </div>

      <StrengthMeter strength={strength} active={password.length > 0} />

      <div>
        <label className="group flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-muted">
          <span className="relative mt-px grid size-[18px] shrink-0 place-items-center">
            <input
              ref={termsRef}
              type="checkbox"
              name="terms"
              checked={terms}
              disabled={submitting}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              onChange={(e) => {
                setTerms(e.target.checked);
                setTouched((t) => ({ ...t, terms: true }));
                if (e.target.checked) setErrors((p) => ({ ...p, terms: null }));
              }}
              className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border border-[#4a4a4a] bg-input transition-colors checked:border-fg checked:bg-fg hover:border-[#6a6a6a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            />
            <Check className="pointer-events-none relative size-3 text-bg opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
          </span>
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-fg underline-offset-4 hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-fg underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" role="alert" className="mt-2 pl-[30px] text-[12.5px] text-fg animate-rise">
            {errors.terms}
          </p>
        )}
      </div>

      <button type="submit" disabled={submitting} aria-busy={submitting} className={`${btnPrimary} group h-12 w-full text-[15px]`}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="flex items-center gap-4 py-0.5" aria-hidden="true">
        <span className="h-px flex-1 bg-line-soft" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">or</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={() =>
          setNotice("Google sign-in will be available when authentication launches. Nothing was sent.")
        }
        className={`${btnSecondary} h-12 w-full text-[14.5px]`}
      >
        <GoogleIcon />
        Continue with Google
      </button>
      {notice && (
        <p role="status" className="-mt-2 text-center text-[12.5px] text-muted animate-rise">
          {notice}
        </p>
      )}

      <p className="pt-1 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-fg underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>

      <p id="register-demo-note" className="text-center text-[11.5px] leading-relaxed text-subtle">
        Preview build — sign-up is simulated and no data leaves your browser.
      </p>
    </form>
  );
}

function StrengthMeter({ strength, active }: { strength: Strength; active: boolean }) {
  return (
    <div className="-mt-1" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-[#232323]">
            <span
              className="block h-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-[var(--ease-out-expo)]"
              style={{
                transform: `scaleX(${active && strength.score > i ? 1 : 0})`,
                backgroundColor: ["#6b6b6b", "#9a9a9a", "#d4d4d4", "#ffffff"][Math.max(0, strength.score - 1)],
              }}
            />
          </span>
        ))}
      </div>
      <p className="mt-2 flex justify-between gap-4 text-[12px] text-muted">
        <span>{active ? strength.hint : "Use 8+ characters with a mix of letters, numbers & symbols."}</span>
        {active && (
          <span className="shrink-0 font-medium text-fg">
            <span className="sr-only">Password strength: </span>
            {strength.label}
          </span>
        )}
      </p>
    </div>
  );
}
