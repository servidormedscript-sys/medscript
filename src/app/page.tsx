import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import LandingPageBackground from "@/components/LandingPageBackground";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <LandingPageBackground>
          <Features />
          <Pricing />
        </LandingPageBackground>
      </main>
      <Footer />
    </>
  );
}
