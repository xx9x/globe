import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  EyeOff,
  Fingerprint,
  Globe2,
  KeyRound,
  Lock,
  MailWarning,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SceneBackground } from "@/components/scenes/SceneBackground";
import { badge, btnPrimary, btnSecondary } from "@/lib/ui";

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-subtle">{eyebrow}</p>
      <h2 className="mt-4 text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[46px]">{title}</h2>
      <p className="mt-5 text-[16.5px] leading-relaxed text-muted">{body}</p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */

type Feature = { icon: LucideIcon; title: string; body: string; points: string[]; wide?: boolean };

const FEATURES: Feature[] = [
  {
    icon: MailWarning,
    title: "Account breach monitoring",
    body: "Find out whether your email addresses or associated credentials have appeared in known data breaches — and get alerted when new ones surface.",
    points: [
      "Have I Been Pwned integration",
      "Publicly documented breach intelligence",
      "Privacy-preserving compromised-password checks",
      "Email alerts for newly discovered breaches",
    ],
    wide: true,
  },
  {
    icon: Radar,
    title: "Website vulnerability assessments",
    body: "For verified business owners: understand how your website looks to an attacker, with clear recommendations to fix what matters.",
    points: [
      "HTTPS & TLS configuration checks",
      "HTTP security header analysis",
      "Exposed software version detection",
      "Authorized scanning of verified domains only",
    ],
    wide: true,
  },
  {
    icon: ShieldCheck,
    title: "Account security monitoring",
    body: "Recommendations, permission reviews for connected apps, and suspicious-activity alerts where providers support them.",
    points: ["Security notifications", "Connected-app permission reviews", "Security status reports"],
  },
  {
    icon: Building2,
    title: "Business security",
    body: "Centralized visibility for teams: monitor many accounts and websites, manage alerts, and assess organizational risk.",
    points: ["Multi-account monitoring", "Website security dashboards", "Organizational assessments"],
  },
  {
    icon: Activity,
    title: "Security monitoring (SIEM)",
    body: "A future layer for collecting security logs, correlating events, and investigating incidents in one place.",
    points: ["Log collection & correlation", "Detection rules", "Incident investigation"],
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 overflow-hidden px-5 pb-28 pt-[300px] sm:px-8 sm:pb-36 sm:pt-[400px] lg:px-10 lg:pt-36">
      {/* Dotted solar system: occupies the right half and dissolves into the page */}
      <SceneBackground
        scene="solar-system"
        className="inset-x-0 top-0 h-[440px] sm:h-[560px] lg:left-auto lg:right-[-4%] lg:h-[980px] lg:w-[64%]"
        fade="radial-gradient(ellipse 74% 66% at 50% 45%, #000 36%, rgba(0,0,0,0.55) 62%, transparent 86%)"
      />
      <div className="relative mx-auto max-w-[1280px]">
        <SectionHeader
          eyebrow="Features"
          title="Everything that protects you, in one calm place."
          body="Globe is launching in stages. These capabilities are on our roadmap — each will be released only once it meets our privacy and security standards."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:mt-56 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 70}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-[#0c0c0c]/75 p-7 backdrop-blur-md transition-colors duration-300 hover:border-line sm:p-8 ${
                f.wide ? "lg:col-span-3" : "lg:col-span-2"
              } ${i === 4 ? "md:col-span-2 lg:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-fg transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5">
                  <f.icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className={badge}>Coming soon</span>
              </div>
              <h3 className="mt-7 text-[20px] font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
              <ul className="mt-6 space-y-2.5 border-t border-line-soft pt-6">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[13.5px] text-[#d4d4d8]">
                    <span className="size-1 rounded-full bg-muted" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email. We'll never ask for the passwords to your other accounts.",
  },
  {
    title: "Add what matters",
    body: "Choose the email addresses to watch and verify ownership of any websites you want assessed.",
  },
  {
    title: "Stay ahead of threats",
    body: "Get clear, prioritized alerts and step-by-step recommendations when something needs your attention.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 overflow-hidden border-t border-line-soft px-5 pb-28 pt-[340px] sm:px-8 sm:pb-36 sm:pt-[440px] lg:px-10 lg:pt-36"
    >
      {/* Dotted Moon scene: an astronaut bounds over and repairs the ship's open panel */}
      <SceneBackground
        scene="moon-repair"
        className="inset-x-0 top-0 h-[460px] sm:h-[580px] lg:left-auto lg:right-[-2%] lg:h-[860px] lg:w-[64%]"
        fade="radial-gradient(ellipse 66% 62% at 52% 46%, #000 40%, rgba(0,0,0,0.55) 64%, transparent 86%)"
      />
      <div className="relative mx-auto max-w-[1280px]">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to a quieter mind."
          body="Globe is designed to do the watching for you, and only speak up when it matters."
        />
        <ol className="mt-16 grid gap-px lg:mt-[380px] overflow-hidden rounded-2xl border border-line-soft bg-line-soft md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="bg-bg p-8 sm:p-10">
              <span className="font-mono text-[13px] text-subtle">0{i + 1}</span>
              <h3 className="mt-10 text-[21px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const PRINCIPLES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: KeyRound,
    title: "We never ask for your passwords",
    body: "Breach checks use your email address. Password checks use k-anonymity, so a full password or its full hash never leaves your device.",
  },
  {
    icon: BadgeCheck,
    title: "Authorization before any scan",
    body: "Active website testing requires explicit consent and verified control of the domain — for example via a DNS record.",
  },
  {
    icon: Lock,
    title: "Encrypted by default",
    body: "Data is encrypted in transit and at rest, with strict access controls and audit logging on every system we run.",
  },
  {
    icon: EyeOff,
    title: "Minimal by design",
    body: "We collect only what we need. Location data is aggregated to the city level — never individual users.",
  },
  {
    icon: Fingerprint,
    title: "Strong authentication",
    body: "Passkeys and multi-factor authentication are planned for every account from day one of launch.",
  },
  {
    icon: Globe2,
    title: "Honest by default",
    body: "This preview uses clearly labeled demonstration data. We'll never present sample events as real incidents.",
  },
];

export function Security() {
  return (
    <section
      id="security"
      className="relative scroll-mt-20 overflow-hidden border-t border-line-soft px-5 pb-[440px] pt-28 sm:px-8 sm:pb-[560px] sm:pt-36 lg:px-10 lg:pb-[600px]"
    >
      {/* Dotted Mars landing: a lander touching down safely beneath the principles */}
      <SceneBackground
        scene="mars-landing"
        className="inset-x-0 bottom-0 h-[620px] sm:h-[760px] lg:top-0 lg:h-auto"
        fade="linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 30%, #000 58%, #000 88%, transparent 100%)"
      />
      <div className="relative mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader
            eyebrow="Security"
            title="Built on principles, not promises."
            body="A security company has to earn trust before it asks for any. These are the rules Globe is built around."
          />
          <Reveal delay={120} className="mt-10 flex flex-wrap gap-3">
            <Link href="/privacy" className={`${btnSecondary} h-11 text-[14px]`}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={`${btnSecondary} h-11 text-[14px]`}>
              Terms
            </Link>
          </Reveal>
        </div>
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 80}>
              <p.icon className="size-5 text-fg" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.015em]">{p.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="border-t border-line-soft px-5 py-28 sm:px-8 sm:py-36 lg:px-10">
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[56px]">
          Your digital world.
          <br />
          <span className="text-muted">Secured.</span>
        </h2>
        <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted">
          Reserve your place and be among the first to use Globe when monitoring goes live.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/#register" className={`${btnPrimary} group h-12 text-[15px]`}>
            Get Started
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link href="/dashboard" className={`${btnSecondary} h-12 text-[15px]`}>
            View dashboard preview
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
