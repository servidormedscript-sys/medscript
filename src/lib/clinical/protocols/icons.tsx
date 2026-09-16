import type { SVGProps } from "react";
import type { ProtocolCategory } from "./types";

type IconProps = SVGProps<SVGSVGElement>;

function IconPulse(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" d="M4 19h4l2-7 4 14 2-7h4" />
    </svg>
  );
}

function IconHeart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" d="M4 12h3l2-6 4 12 2-6h5" />
    </svg>
  );
}

function IconBrain(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M9 10v4m6-4v4" />
    </svg>
  );
}

function IconLungs(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M8 8c-2 0-3 2-3 4s1 4 3 4m8-8c2 0 3 2 3 4s-1 4-3 4" />
    </svg>
  );
}

function IconDroplet(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 4 6 7 6 11a6 6 0 1 1-12 0c0-4 3-7 6-11Z" />
    </svg>
  );
}

function IconBaby(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="8" r="3" />
      <path strokeLinecap="round" d="M8 21v-4a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconMind(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="5" r="2" />
      <path strokeLinecap="round" d="M12 7v4m-3 3 3 3 3-3" />
    </svg>
  );
}

function IconBed(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 14v5h18v-5M3 14V9h7v5M10 9h11v5M7 11h.01" />
    </svg>
  );
}

function IconTool(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 7l3 3-7 7H7v-3l7-7Z" />
    </svg>
  );
}

const ICONS: Record<ProtocolCategory["icon"], React.ComponentType<IconProps>> = {
  pulse: IconPulse,
  heart: IconHeart,
  brain: IconBrain,
  lungs: IconLungs,
  droplet: IconDroplet,
  stomach: IconDroplet,
  baby: IconBaby,
  mind: IconMind,
  bed: IconBed,
  tool: IconTool,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon: ProtocolCategory["icon"];
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon className={className} />;
}
