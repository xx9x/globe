import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/dashboard", label: "Dashboard preview" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#security", label: "Security" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/#register", label: "Get Started" },
      { href: "/login", label: "Log In" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line-soft px-5 pb-10 pt-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[14px] leading-relaxed text-muted">Your digital world. Secured.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[14px] text-muted transition-colors hover:text-fg">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-line-soft pt-8 text-[12.5px] text-subtle sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Globe. Preview build — figures shown are demonstration data.</p>
          <p>Set in Mona Sans by GitHub.</p>
        </div>
      </div>
    </footer>
  );
}
