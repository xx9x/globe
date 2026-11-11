import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { Card, PageHeader, SeverityBadge, Stat } from "@/components/dashboard/ui";
import { SAMPLE_SCAN } from "@/lib/sample-dashboard";

export const metadata: Metadata = { title: "Website security" };

export default function WebsitesPage() {
  const issues = SAMPLE_SCAN.findings.filter((f) => f.severity !== "pass");
  const passed = SAMPLE_SCAN.findings.length - issues.length;
  return (
    <>
      <PageHeader
        title="Website Security"
        description="Passive configuration checks for domains you've verified. Results below are sample data."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted">
          <BadgeCheck className="size-3.5 text-fg" /> {SAMPLE_SCAN.domain} · verified owner
        </span>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Issues found" value={issues.length} sub="2 medium · 2 low" />
        <Stat label="Checks passed" value={passed} />
        <Stat label="Last scan" value="Nov 8" sub={SAMPLE_SCAN.scannedAt} />
      </div>
      <Card title={`Scan results — ${SAMPLE_SCAN.domain}`} className="mt-4">
        <ul className="divide-y divide-line-soft">
          {SAMPLE_SCAN.findings.map((f) => (
            <li key={f.id} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[88px_1fr]">
              <div><SeverityBadge severity={f.severity} /></div>
              <div>
                <p className="text-[14px] font-medium">{f.check}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {f.severity === "pass" ? f.fix : <><span className="text-[#d4d4d8]">Recommended fix: </span>{f.fix}</>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-6 text-[12.5px] leading-relaxed text-subtle">
        Globe will only run active tests against domains with verified ownership and explicit authorization. This
        preview performs no scanning of any kind.
      </p>
    </>
  );
}
