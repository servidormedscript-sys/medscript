import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LandingAmbient from "@/components/LandingAmbient";
import LandingPageBackground from "@/components/LandingPageBackground";
import HomeJsonLd from "@/components/seo/HomeJsonLd";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "MEDScript — Gestão clínica para plantão e emergência",
  description:
    "Prontuário, T0, Kanban, protocolos assistenciais e alertas de medicamento. Plataforma para plantonistas e clínicas hospitalares.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MEDScript — Gestão clínica para plantão e emergência",
    description:
      "Prontuário, T0, Kanban, protocolos assistenciais e alertas de medicamento. Plataforma para plantonistas e clínicas hospitalares.",
    url: "/",
  },
};

const FeaturesLazy = dynamic(() => import("@/components/Features"), {
  loading: () => (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-navy-800/50">
        Carregando módulos…
      </div>
    </section>
  ),
});

const PricingLazy = dynamic(() => import("@/components/Pricing"), {
  loading: () => <div className="min-h-[480px]" aria-hidden="true" />,
});

export default function Home() {
  return (
    <>
      <HomeJsonLd />
      <main className="relative isolate">
        <LandingAmbient />
        <div className="relative z-10">
          <Hero />
          <LandingPageBackground>
            <FeaturesLazy />
            <PricingLazy />
          </LandingPageBackground>
        </div>
      </main>
      <Footer />
    </>
  );
}
