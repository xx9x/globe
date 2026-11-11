import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Account, notification, and security preferences." />
      <SettingsPanel />
    </>
  );
}
