import type { Metadata } from "next";
import { Nav } from "@/components/landing/Nav";
import Globe from "@/components/globe/Globe";
import { LoginForm } from "@/components/auth/LoginForm";
import { DEMO_LOCATIONS } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Log in" };

const VIEW = { lat: 30, lon: 10, distance: 1.08 };

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main id="main" className="grid min-h-[100svh] lg:grid-cols-[55fr_45fr]">
        <div className="relative hidden lg:block">
          <Globe
            locations={DEMO_LOCATIONS}
            valueLabel="users protected"
            defaultView={VIEW}
            label="Interactive 3D globe with demonstration user counts by city."
            className="absolute inset-0 animate-fade"
            controlsClassName="bottom-8 right-10"
          />
        </div>
        <div className="flex items-center px-5 pb-16 pt-28 sm:px-10 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[400px] lg:mx-0">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] animate-rise sm:text-[38px]">Welcome back.</h1>
            <p className="mt-3 text-[15.5px] text-muted animate-rise delay-1">Log in to your Globe account.</p>
            <div className="mt-9 animate-rise delay-2">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
