"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, LayoutGrid, MailWarning, Radar, Settings, FlaskConical, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/breaches", label: "Breach Monitoring", icon: MailWarning },
  { href: "/dashboard/websites", label: "Website Security", icon: Radar },
  { href: "/dashboard/activity", label: "Global Activity", icon: Globe2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line-soft bg-bg/85 backdrop-blur-xl lg:h-svh lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:px-6">
          <Logo />
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle lg:hidden">
            Demo
          </span>
        </div>
        <nav aria-label="Dashboard" className="overflow-x-auto px-3 pb-3 lg:px-3 lg:pt-4">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                      active ? "bg-hover text-fg" : "text-muted hover:bg-surface hover:text-fg"
                    }`}
                  >
                    <item.icon className="size-4" strokeWidth={1.7} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute inset-x-3 bottom-4 hidden rounded-xl border border-line-soft p-4 lg:block">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold">
            <FlaskConical className="size-3.5" /> Preview mode
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            You&apos;re viewing sample data. No account is signed in.
          </p>
          <Link href="/" className="mt-3 inline-block text-[12px] font-medium text-fg underline-offset-4 hover:underline">
            Back to site
          </Link>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div
          role="note"
          className="mb-8 flex items-center gap-2.5 rounded-[10px] border border-line-soft bg-surface px-4 py-2.5 text-[12.5px] text-muted"
        >
          <FlaskConical className="size-3.5 shrink-0 text-fg" aria-hidden="true" />
          <span>
            <span className="font-semibold text-fg">Demo dashboard.</span> All data on this page is sample data and
            does not represent real accounts, breaches, or security incidents.
          </span>
        </div>
        <div className="mx-auto max-w-[1200px] animate-rise">{children}</div>
      </main>
    </div>
  );
}
