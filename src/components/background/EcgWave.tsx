const ECG_BASELINE = 50;
const BEAT_WIDTH = 200;

function buildBeatSegment(startX: number) {
  const x = (offset: number) => startX + offset;
  const y = ECG_BASELINE;

  return [
    `H${x(28)}`,
    `L${x(34)} ${y}`,
    `L${x(38)} ${y - 3}`,
    `L${x(42)} ${y}`,
    `H${x(48)}`,
    `L${x(52)} ${y}`,
    `L${x(56)} ${y - 2}`,
    `L${x(60)} 16`,
    `L${x(68)} 84`,
    `L${x(76)} 24`,
    `L${x(82)} ${y}`,
    `H${x(112)}`,
    `L${x(120)} ${y + 4}`,
    `L${x(128)} ${y + 2}`,
    `L${x(136)} ${y}`,
    `H${x(BEAT_WIDTH)}`,
  ].join(" ");
}

const ECG_PATH = (() => {
  const beats = Array.from({ length: 6 }, (_, index) =>
    buildBeatSegment(index * BEAT_WIDTH),
  );
  return `M0 ${ECG_BASELINE} ${beats.join(" ")}`;
})();

export function EcgWave({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1={ECG_BASELINE}
        x2="1200"
        y2={ECG_BASELINE}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d={ECG_PATH}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type EcgTrackProps = {
  className?: string;
  reverse?: boolean;
  animationClass?: string;
  reverseClass?: string;
};

export function EcgTrack({
  className,
  reverse = false,
  animationClass = "ecg-track-scroll",
  reverseClass = "ecg-track-scroll-reverse",
}: EcgTrackProps) {
  return (
    <div
      className={`flex w-[200%] ${animationClass} ${
        reverse ? reverseClass : ""
      } ${className ?? ""}`}
    >
      <EcgWave className="h-full w-1/2 shrink-0" />
      <EcgWave className="h-full w-1/2 shrink-0" />
    </div>
  );
}
