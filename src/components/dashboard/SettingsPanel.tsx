"use client";

import { useId, useState } from "react";
import { Card } from "./ui";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { btnSecondary } from "@/lib/ui";

function Toggle({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div>
        <p id={id} className="text-[14px] font-medium">{label}</p>
        <p className="mt-0.5 text-[13px] text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={() => setOn(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${on ? "border-fg bg-fg" : "border-line bg-input"}`}
      >
        <span className={`absolute top-0.5 size-[18px] rounded-full transition-[left,background-color] duration-200 ease-[var(--ease-out-expo)] ${on ? "left-[21px] bg-bg" : "left-0.5 bg-[#8a8a8a]"}`} />
      </button>
    </div>
  );
}

/** Settings are local to this page in the preview and are not saved. */
export function SettingsPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Account preferences">
        <dl className="divide-y divide-line-soft text-[14px]">
          <div className="flex justify-between py-3 first:pt-0"><dt className="text-muted">Email</dt><dd>you@example.com <span className="text-subtle">(sample)</span></dd></div>
          <div className="flex justify-between py-3"><dt className="text-muted">Plan</dt><dd>Personal · Preview</dd></div>
          <div className="flex justify-between py-3 last:pb-0"><dt className="text-muted">Region</dt><dd>Auto</dd></div>
        </dl>
      </Card>
      <Card title="Notification settings">
        <div className="divide-y divide-line-soft">
          <Toggle label="New breach alerts" description="Email me when a monitored address appears in a breach." defaultOn />
          <Toggle label="Website scan reports" description="Weekly summary for verified domains." defaultOn />
          <Toggle label="Product updates" description="Occasional news about new Globe capabilities." />
        </div>
      </Card>
      <Card title="Connected services">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-line"><GoogleIcon /></span>
            <div>
              <p className="text-[14px] font-medium">Google</p>
              <p className="text-[13px] text-muted">Not connected</p>
            </div>
          </div>
          <button type="button" disabled className={`${btnSecondary} h-9 text-[13px]`} title="Available when authentication launches">
            Coming soon
          </button>
        </div>
      </Card>
      <Card title="Security settings">
        <div className="divide-y divide-line-soft">
          <Toggle label="Two-factor authentication" description="Require a second step when signing in (available at launch)." />
          <Toggle label="Sign-in alerts" description="Notify me about sign-ins from new devices." defaultOn />
        </div>
      </Card>
      <p className="text-[12.5px] text-subtle lg:col-span-2">Preview only — changes on this page are not saved.</p>
    </div>
  );
}
