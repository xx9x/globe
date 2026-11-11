import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, PageHeader, SeverityBadge, Stat } from "@/components/dashboard/ui";
import { SAMPLE_ALERTS, SAMPLE_OVERVIEW } from "@/lib/sample-dashboard";

export default function OverviewPage() {
  const { score, accountsMonitored, websitesMonitored, openAlerts } = SAMPLE_OVERVIEW;
  const circumference = 2 * Math.PI * 52;
  return (
    <>
      <PageHeader title="Overview" description="Your overall security posture at a glance (sample data)." />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <Card title="Security status">
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" role="img" aria-label={`Sample security score ${score} out of 100`}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#222" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
            </svg>
            <div>
              <p className="text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{score}</p>
              <p className="mt-1 text-[13px] text-muted">out of 100 · Good</p>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">Resolve 2 high-severity alerts to reach 90+.</p>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Accounts monitored" value={accountsMonitored} sub="Email addresses" />
          <Stat label="Websites monitored" value={websitesMonitored} sub="Verified domains" />
          <Stat label="Open alerts" value={openAlerts} sub="2 high · 1 medium · 1 low" />
        </div>
      </div>

      <Card
        title="Recent alerts"
        className="mt-4"
        action={
          <Link href="/dashboard/breaches" className="flex items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
            View all <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        <ul className="divide-y divide-line-soft">
          {SAMPLE_ALERTS.map((a) => (
            <li key={a.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <SeverityBadge severity={a.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{a.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{a.detail}</p>
              </div>
              <span className="shrink-0 text-[12px] text-subtle">{a.when}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
