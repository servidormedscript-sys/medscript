import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LandingPageBackground from "@/components/LandingPageBackground";
import dynamic from "next/dynamic";

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
      <main>
        <Hero />
        <LandingPageBackground>
          <FeaturesLazy />
          <PricingLazy />
        </LandingPageBackground>
      </main>
      <Footer />
    </>
  );
}
