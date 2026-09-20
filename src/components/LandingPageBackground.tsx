import { EcgTrack } from "@/components/background/EcgWave";

type LandingPageBackgroundProps = {
  children: React.ReactNode;
};

export default function LandingPageBackground({
  children,
}: LandingPageBackgroundProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-ocean-100 via-ocean-50 to-ocean-100">
      <div className="landing-fx-layer pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="landing-grid absolute inset-0" />

        <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-ocean-300/20" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-ocean-400/15" />

        <div className="ecg-track-fade absolute inset-x-0 top-[22%] h-20 overflow-hidden opacity-[0.14]">
          <EcgTrack animationClass="landing-ecg-track" className="text-ocean-600" />
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
