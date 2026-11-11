import type { Metadata } from "next";
import Globe from "@/components/globe/Globe";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { DEMO_ACTIVITY, formatNumber } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Global activity" };

const VIEW = { lat: 25, lon: 20, distance: 1 };

export default function ActivityPage() {
  const sorted = [...DEMO_ACTIVITY].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value ?? 1;
  return (
    <>
      <PageHeader
        title="Global Activity"
        description="Aggregated, city-level security event counts. Sample data — not real incidents."
      />
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="relative h-[460px] overflow-hidden p-0 sm:h-[560px]">
          <Globe
            locations={DEMO_ACTIVITY}
            valueLabel="sample events (7 days)"
            defaultView={VIEW}
            label="Interactive 3D globe showing sample security event counts by city."
            className="absolute inset-0"
            controlsClassName="bottom-4 right-4"
          />
        </Card>
        <Card title="Regional activity (sample)">
          <ul className="space-y-3.5">
            {sorted.slice(0, 9).map((l) => (
              <li key={l.id}>
                <div className="flex justify-between text-[13px]">
                  <span>{l.city}, <span className="text-muted">{l.country}</span></span>
                  <span className="tabular-nums text-muted">{formatNumber(l.value)}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-[#1d1d1d]">
                  <div className="h-full rounded-full bg-fg/80" style={{ width: `${(l.value / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
