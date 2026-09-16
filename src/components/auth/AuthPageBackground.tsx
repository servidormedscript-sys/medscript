import { EcgTrack } from "@/components/background/EcgWave";

type AuthPageBackgroundProps = {
  children: React.ReactNode;
};

export default function AuthPageBackground({ children }: AuthPageBackgroundProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-ocean-900 to-ocean-800">
      <div className="auth-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(215,38,56,0.1),transparent_50%)]"
        aria-hidden="true"
      />

      <div
        className="auth-orbit-slow pointer-events-none absolute left-1/2 top-1/2 h-[min(420px,88vw)] w-[min(420px,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]"
        aria-hidden="true"
      />
      <div
        className="auth-orbit-reverse pointer-events-none absolute left-1/2 top-1/2 h-[min(300px,68vw)] w-[min(300px,68vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.06]"
        aria-hidden="true"
      />

      <div
        className="auth-pulse-ring pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-med-red/25"
        aria-hidden="true"
      />
      <div
        className="auth-pulse-ring auth-pulse-ring-delay pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ocean-300/20"
        aria-hidden="true"
      />

      <div className="ecg-track-fade pointer-events-none absolute inset-x-0 top-[10%] h-20 overflow-hidden opacity-25">
        <EcgTrack animationClass="auth-ecg-horizontal" className="text-med-red/80" />
      </div>

      <div className="ecg-track-fade pointer-events-none absolute inset-x-0 top-1/2 h-[4.5rem] -translate-y-1/2 overflow-hidden opacity-15">
        <EcgTrack
          reverse
          reverseClass="auth-ecg-horizontal-reverse"
          animationClass="auth-ecg-horizontal"
          className="text-ocean-200"
        />
      </div>

      <div className="ecg-track-fade pointer-events-none absolute inset-x-0 bottom-[8%] h-20 overflow-hidden opacity-20">
        <EcgTrack animationClass="auth-ecg-horizontal" className="text-white/70" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
