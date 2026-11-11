import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, PageHeader, SeverityBadge, Stat } from "@/components/dashboard/ui";
import { SAMPLE_BREACHES, SAMPLE_BREACH_ACTIONS } from "@/lib/sample-dashboard";

export const metadata: Metadata = { title: "Breach monitoring" };

export default function BreachesPage() {
  return (
    <>
      <PageHeader
        title="Breach Monitoring"
        description="Known breaches involving your monitored email addresses. Breach names below are fictional samples."
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Known breaches" value={SAMPLE_BREACHES.length} />
        <Stat label="Exposed accounts" value={2} sub="of 3 monitored" />
        <Stat label="Most recent" value="Mar 2026" />
      </div>

      <Card title="Known breaches" className="mt-4">
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="text-[12px] text-subtle">
              <tr className="border-b border-line-soft">
                <th scope="col" className="pb-3 font-medium">Breach</th>
                <th scope="col" className="pb-3 font-medium">Date</th>
                <th scope="col" className="pb-3 font-medium">Account</th>
                <th scope="col" className="pb-3 font-medium">Exposed data</th>
                <th scope="col" className="pb-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {SAMPLE_BREACHES.map((b) => (
                <tr key={b.id}>
                  <td className="py-4 font-medium">{b.name} <span className="text-subtle">(sample)</span></td>
                  <td className="py-4 tabular-nums text-muted">{b.date}</td>
                  <td className="py-4 text-muted">{b.account}</td>
                  <td className="py-4 text-muted">{b.data.join(", ")}</td>
                  <td className="py-4"><SeverityBadge severity={b.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Recommended actions" className="mt-4">
        <ul className="space-y-3">
          {SAMPLE_BREACH_ACTIONS.map((a) => (
            <li key={a} className="flex gap-3 text-[14px] text-[#d4d4d8]">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line">
                <Check className="size-3" />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
