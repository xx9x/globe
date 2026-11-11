/**
 * SAMPLE DATA for the dashboard preview. Every name, breach, domain and finding
 * below is fictional and exists only to demonstrate the interface. Nothing here
 * is a real security incident. Replace with API calls to the future FastAPI
 * backend (see README → "Future backend").
 */

export type Severity = "critical" | "high" | "medium" | "low" | "pass";

export const SAMPLE_OVERVIEW = {
  score: 78,
  accountsMonitored: 3,
  websitesMonitored: 1,
  openAlerts: 4,
};

export const SAMPLE_ALERTS: { id: string; title: string; detail: string; severity: Severity; when: string }[] = [
  { id: "a1", title: "Email found in sample breach", detail: "you@example.com appeared in “Northwind Forums” (sample).", severity: "high", when: "2h ago" },
  { id: "a2", title: "Missing security header", detail: "example.com does not send Content-Security-Policy.", severity: "medium", when: "1d ago" },
  { id: "a3", title: "TLS certificate expires soon", detail: "example.com certificate expires in 18 days.", severity: "low", when: "2d ago" },
  { id: "a4", title: "Reused password detected", detail: "A saved password matched a known-compromised password (sample).", severity: "high", when: "4d ago" },
];

export const SAMPLE_BREACHES = [
  {
    id: "b1",
    name: "Northwind Forums",
    date: "2026-03-14",
    account: "you@example.com",
    data: ["Email addresses", "Usernames", "Hashed passwords"],
    severity: "high" as Severity,
  },
  {
    id: "b2",
    name: "Contoso Rewards",
    date: "2025-11-02",
    account: "you@example.com",
    data: ["Email addresses", "Names"],
    severity: "medium" as Severity,
  },
  {
    id: "b3",
    name: "Fabrikam Travel",
    date: "2024-06-21",
    account: "work@example.org",
    data: ["Email addresses", "Phone numbers", "Partial addresses"],
    severity: "medium" as Severity,
  },
];

export const SAMPLE_BREACH_ACTIONS = [
  "Change the password on any account that shared a password with Northwind Forums.",
  "Turn on multi-factor authentication for your primary email account.",
  "Be cautious of phishing emails that reference your Contoso Rewards membership.",
  "Use a password manager to generate unique passwords for every site.",
];

export const SAMPLE_SCAN = {
  domain: "example.com",
  verified: true,
  scannedAt: "2026-11-08 14:20 UTC",
  findings: [
    { id: "f1", check: "Content-Security-Policy header", severity: "medium" as Severity, fix: "Add a Content-Security-Policy header that restricts script sources to trusted origins." },
    { id: "f2", check: "Server version disclosed", severity: "medium" as Severity, fix: "Remove or genericize the Server and X-Powered-By response headers." },
    { id: "f3", check: "TLS certificate expiry (18 days)", severity: "low" as Severity, fix: "Enable automatic certificate renewal, or renew before the expiry date." },
    { id: "f4", check: "Strict-Transport-Security header", severity: "low" as Severity, fix: "Send HSTS with max-age of at least 15552000 and includeSubDomains." },
    { id: "f5", check: "HTTPS redirect", severity: "pass" as Severity, fix: "All HTTP requests redirect to HTTPS." },
    { id: "f6", check: "TLS 1.0 / 1.1 disabled", severity: "pass" as Severity, fix: "Only TLS 1.2 and 1.3 are offered." },
    { id: "f7", check: "X-Content-Type-Options header", severity: "pass" as Severity, fix: "nosniff is set." },
  ],
};
