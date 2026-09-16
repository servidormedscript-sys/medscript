import BrandLogo from "@/components/BrandLogo";
import LandingPageBackground from "@/components/LandingPageBackground";
import { LEGAL_LAST_UPDATED } from "@/lib/branding";
import type { LegalDocument } from "@/lib/legal/types";
import Link from "next/link";

type LegalPageLayoutProps = {
  document: LegalDocument;
};

export default function LegalPageLayout({ document }: LegalPageLayoutProps) {
  return (
    <>
      <LandingPageBackground>
        <div className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-8 flex justify-center">
              <Link href="/" className="inline-flex">
                <BrandLogo
                  size="hero"
                  priority
                  className="h-24 w-auto md:h-28"
                />
              </Link>
            </div>

            <article className="overflow-hidden rounded-3xl border border-ocean-100 bg-white/95 shadow-lg shadow-ocean-900/10 backdrop-blur-sm">
              <header className="border-b border-ocean-50 bg-ocean-50/50 px-6 py-6 md:px-8">
                <p className="text-xs font-medium uppercase tracking-wide text-ocean-800">
                  Documentação legal
                </p>
                <h1 className="mt-2 text-2xl font-bold text-navy-900 md:text-3xl">
                  {document.title}
                </h1>
                <p className="mt-2 text-sm text-navy-800/60">
                  {document.description}
                </p>
                <p className="mt-3 text-xs text-navy-800/45">
                  Última atualização: {LEGAL_LAST_UPDATED}
                </p>
              </header>

              <div className="space-y-8 px-6 py-8 md:px-8">
                {document.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-base font-semibold text-navy-900">
                      {section.heading}
                    </h2>
                    <div className="mt-3 space-y-3">
                      {section.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph.slice(0, 40)}
                          className="text-sm leading-relaxed text-navy-800/70"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <p className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-ocean-800 hover:text-ocean-950"
              >
                Voltar ao site
              </Link>
            </p>
          </div>
        </div>
      </LandingPageBackground>
    </>
  );
}
