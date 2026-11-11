import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="px-5 pb-24 pt-32 sm:px-8">
        <article className="mx-auto max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-subtle">Draft · Preview build</p>
          <h1 className="mt-4 text-[40px] font-semibold tracking-[-0.03em]">{title}</h1>
          <div className="mt-10 space-y-6 text-[15.5px] leading-relaxed text-muted [&_h2]:mt-12 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-fg">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
