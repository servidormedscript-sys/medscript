import { EcgTrack } from "@/components/background/EcgWave";

type LandingPageBackgroundProps = {
  children: React.ReactNode;
};

function MedicalCross({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4v16M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LandingPageBackground({
  children,
}: LandingPageBackgroundProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-ocean-100 via-ocean-50 to-ocean-100">
      <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div
        className="landing-float-slow pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-ocean-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="landing-float-slow landing-float-delay pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-ocean-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="landing-pulse-ring pointer-events-none absolute bottom-32 left-1/4 h-56 w-56 rounded-full border border-med-red/15 bg-med-red/[0.04]"
        aria-hidden="true"
      />
      <div
        className="landing-pulse-ring landing-float-delay pointer-events-none absolute right-1/4 top-48 h-40 w-40 rounded-full border border-ocean-400/20 bg-ocean-300/10"
        aria-hidden="true"
      />

      <MedicalCross className="landing-float-slow pointer-events-none absolute left-[8%] top-[18%] h-8 w-8 text-ocean-400/25" />
      <MedicalCross className="landing-float-slow landing-float-delay pointer-events-none absolute right-[12%] top-[42%] h-6 w-6 text-ocean-500/20" />
      <MedicalCross className="landing-float-slow pointer-events-none absolute bottom-[28%] left-[18%] h-5 w-5 text-ocean-300/30" />

      <div className="ecg-track-fade pointer-events-none absolute inset-x-0 top-[20%] h-24 overflow-hidden opacity-[0.18]">
        <EcgTrack animationClass="landing-ecg-track" className="text-ocean-600" />
      </div>

      <div className="ecg-track-fade pointer-events-none absolute inset-x-0 bottom-[16%] h-20 overflow-hidden opacity-[0.12]">
        <EcgTrack
          reverse
          reverseClass=""
          animationClass="landing-ecg-track landing-ecg-reverse"
          className="text-ocean-700"
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
