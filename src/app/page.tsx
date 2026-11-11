import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features, FinalCta, HowItWorks, Security } from "@/components/landing/Sections";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="grain relative">
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
