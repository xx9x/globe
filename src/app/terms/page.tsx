import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Terms and Conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions">
      <p>
        These terms are a placeholder for Globe&apos;s preview build and are not yet legally binding. Final
        terms will be published, reviewed by counsel, before any account can be created.
      </p>
      <h2>Preview service</h2>
      <p>
        This version of Globe is a demonstration. Sign-up and sign-in are simulated, no accounts are created,
        and all statistics, alerts and scan results are sample data.
      </p>
      <h2>Authorized use only</h2>
      <p>
        When website assessments launch, you may only request scans of domains you own or are explicitly
        authorized to test. Globe will require verified control of a domain before any active testing.
      </p>
      <h2>No passwords for other services</h2>
      <p>Globe will never ask you for the passwords to your other accounts in order to check for breaches.</p>
    </LegalPage>
  );
}
