import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This is a draft for Globe&apos;s preview build. In this version, nothing you type into a form is sent to
        a server or stored — validation happens entirely in your browser.
      </p>
      <h2>What we will collect</h2>
      <p>
        Only what&apos;s needed to provide the service: your account email, the email addresses you choose to
        monitor, and the domains you verify for assessments.
      </p>
      <h2>Breach checks</h2>
      <p>
        Compromised-password checks will use k-anonymity: only the first characters of a password hash are
        sent, so your password — or its full hash — never leaves your device.
      </p>
      <h2>Location data</h2>
      <p>
        Any map or globe visualization shows data aggregated to the city level. Globe will never display an
        individual user&apos;s location or personal information.
      </p>
    </LegalPage>
  );
}
