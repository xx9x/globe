"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { btnPrimary } from "@/lib/ui";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#security", label: "Security" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? "border-b border-line-soft bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-10" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-muted transition-colors duration-200 hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-muted transition-colors duration-200 hover:text-fg"
          >
            Log In
          </Link>
          <Link href="/#register" className={`${btnPrimary} h-9 text-[13.5px]`}>
            Get Started
          </Link>
        </div>

        <button
          ref={menuButton}
          type="button"
          className="grid size-10 place-items-center rounded-lg text-fg transition-colors hover:bg-hover md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-line-soft px-5 pb-6 pt-2 md:hidden"
      >
        <ul className="flex flex-col">
          {LINKS.map((l, i) => (
            <li key={l.href} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line-soft py-4 text-[17px] font-medium text-fg"
              >
                {l.label}
                <ArrowRight className="size-4 text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid grid-cols-2 gap-3 animate-rise delay-3">
          <Link href="/login" onClick={() => setOpen(false)} className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line text-[15px] font-medium">
            Log In
          </Link>
          <Link href="/#register" onClick={() => setOpen(false)} className={`${btnPrimary} h-11 text-[15px]`}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
