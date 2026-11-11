import type { Severity } from "@/lib/sample-dashboard";

export function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{title}</h1>
        <p className="mt-1.5 text-[14.5px] text-muted">{description}</p>
      </div>
      {children}
    </header>
  );
}

export function Card({ title, action, className = "", children }: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-line-soft bg-[#0c0c0c] p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const SEVERITY: Record<Severity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-fg text-bg border-fg" },
  high: { label: "High", className: "bg-[#d4d4d8] text-bg border-[#d4d4d8]" },
  medium: { label: "Medium", className: "border-[#8a8a8a] text-fg" },
  low: { label: "Low", className: "border-line text-muted" },
  pass: { label: "Pass", className: "border-line-soft text-subtle" },
};

/** Monochrome severity: filled = more severe, outlined = less. Text label always present. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${s.className}`}>
      {s.label}
    </span>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-[#0c0c0c] p-5">
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-[12px] text-subtle">{sub}</p>}
    </div>
  );
}
