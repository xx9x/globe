import Globe from "@/components/globe/Globe";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { DEMO_LOCATIONS, DEMO_TOTAL_PROTECTED, formatNumber } from "@/lib/demo-data";

export function Hero() {
  return (
    <section
      aria-label="Create your Globe account"
      className="relative grid min-h-[100svh] grid-cols-1 lg:grid-cols-[55fr_45fr]"
    >
      {/* ---------------- Left: the Earth ---------------- */}
      <div className="relative flex min-h-[min(118vw,600px)] flex-col pt-16 sm:min-h-[640px] lg:min-h-[100svh]">
        <Globe
          locations={DEMO_LOCATIONS}
          valueLabel="users protected"
          label="Interactive 3D globe of the Earth made of dots, with markers showing demonstration user counts by city."
          className="absolute inset-0 animate-fade"
          offsetY={0.055}
          controlsClassName="bottom-5 right-5 sm:bottom-8 sm:right-8 lg:right-10"
        />

        {/* Protection indicator */}
        <div className="relative z-10 flex justify-center px-5 pt-4 sm:justify-end sm:px-8 lg:px-10 lg:pt-6">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line-soft bg-bg/60 py-1.5 pl-2 pr-3.5 text-[12.5px] text-muted backdrop-blur-md animate-rise delay-2">
            <span className="relative grid size-4 place-items-center" aria-hidden="true">
              <span className="absolute size-4 rounded-full bg-fg/15 motion-safe:animate-ping" />
              <span className="size-1.5 rounded-full bg-fg" />
            </span>
            <span>
              <span className="font-semibold text-fg">{formatNumber(DEMO_TOTAL_PROTECTED)}</span> users protected
            </span>
            <span className="rounded-full border border-line px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] text-subtle">
              Demo
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div className="pointer-events-none relative z-10 mt-auto hidden px-8 pb-10 lg:block lg:px-10">
          <p className="max-w-md text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] animate-rise delay-4 xl:text-[40px]">
            Your digital world.
            <br />
            <span className="text-muted">Secured.</span>
          </p>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-subtle animate-rise delay-5">
            Drag to rotate. Click the globe, then scroll to zoom. Select a point to see its region.
          </p>
        </div>
      </div>

      {/* ---------------- Right: registration ---------------- */}
      <div
        id="register"
        className="relative flex scroll-mt-16 items-center px-5 pb-16 pt-6 sm:px-10 lg:px-12 lg:pb-12 lg:pt-24 xl:px-20"
      >
        <div className="mx-auto w-full max-w-[440px] lg:mx-0">
          {/* Tagline on small screens (left column hides it) */}
          <p className="mb-8 text-center text-[13px] font-medium uppercase tracking-[0.16em] text-subtle lg:hidden">
            Your digital world. Secured.
          </p>
          <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] animate-rise delay-1 sm:text-[38px]">
            Secure your digital world.
          </h1>
          <p className="mt-3.5 max-w-[400px] text-[15.5px] leading-relaxed text-muted animate-rise delay-2">
            One platform to monitor, protect, and strengthen your digital security.
          </p>
          <div className="mt-9 animate-rise delay-3">
            <RegisterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
