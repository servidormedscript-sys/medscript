import { EcgTrack } from "@/components/background/EcgWave";

function MedicalCross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4v16M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Decoração fixa na viewport — scroll do conteúdo não repinta estes efeitos. */
export default function LandingAmbient() {
  return (
    <div
      className="landing-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="landing-grid absolute inset-0 opacity-90" />

      <div className="landing-ambient-blob absolute -left-20 top-[12%] h-80 w-80 rounded-full bg-ocean-300/25" />
      <div className="landing-ambient-blob landing-float-slow landing-float-delay absolute -right-24 top-[38%] h-96 w-96 rounded-full bg-ocean-400/18" />
      <div className="landing-pulse-ring absolute bottom-[22%] left-[12%] h-52 w-52 rounded-full border border-med-red/12 bg-med-red/[0.04]" />
      <div className="landing-pulse-ring landing-float-delay absolute right-[10%] top-[52%] h-36 w-36 rounded-full border border-ocean-400/15 bg-ocean-300/[0.06]" />

      <MedicalCross className="landing-float-slow absolute left-[7%] top-[20%] h-7 w-7 text-ocean-400/30" />
      <MedicalCross className="landing-float-slow landing-float-delay absolute right-[14%] top-[44%] h-5 w-5 text-ocean-500/25" />
      <MedicalCross className="landing-float-slow absolute bottom-[30%] left-[20%] h-4 w-4 text-ocean-300/35" />

      <div className="ecg-track-fade absolute inset-x-0 top-[18%] h-24 opacity-[0.16]">
        <EcgTrack animationClass="landing-ecg-track" className="text-ocean-600" />
      </div>
      <div className="ecg-track-fade absolute inset-x-0 bottom-[20%] h-20 opacity-[0.1]">
        <EcgTrack
          reverse
          reverseClass=""
          animationClass="landing-ecg-track landing-ecg-reverse"
          className="text-ocean-700"
        />
      </div>
    </div>
  );
}
