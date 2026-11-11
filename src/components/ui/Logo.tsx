import Link from "next/link";

/** Globe mark: a sphere, one meridian, and an orbiting node for global connectivity. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="15" cy="17" r="10.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15 6.75c-3.1 2.85-4.65 6.27-4.65 10.25S11.9 24.4 15 27.25c3.1-2.85 4.65-6.27 4.65-10.25S18.1 9.6 15 6.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M4.9 17h20.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26.6" cy="5.6" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 text-fg ${className}`}
      aria-label="Globe — home"
    >
      <LogoMark className="size-[26px] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[-12deg]" />
      <span className="text-[19px] font-semibold tracking-[-0.02em] [font-stretch:112%]">Globe</span>
    </Link>
  );
}
