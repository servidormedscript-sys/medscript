import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBrain(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5c-2 1-3 3-3 5.5 0 1.2.4 2.2 1 3-.6.8-1 1.8-1 3 0 2.5 2 4.5 4.5 4.5.8 0 1.5-.2 2.1-.5.6.8 1.6 1.3 2.7 1.3 2.2 0 4-1.8 4-4 0-1.2-.5-2.2-1.2-3 .7-.8 1.2-1.8 1.2-3C18 8 16 6 13.5 5.5 12.8 4.6 11.5 4 10 4c-.8 0-1.5.2-2 .5"
      />
      <path strokeLinecap="round" d="M12 5v14M10 10h4M10 14h4" />
    </svg>
  );
}

function IconAbdomen(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <ellipse cx="12" cy="14" rx="6" ry="5" />
      <path strokeLinecap="round" d="M8 10c0-2 1.8-4 4-4s4 2 4 4" />
    </svg>
  );
}

function IconLimb(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 20V8l4-4 4 4v12" />
      <path strokeLinecap="round" d="M8 12h8M10 16h4" />
    </svg>
  );
}

function IconLungsHeart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M8 8c-2 0-3 2-3 4s1 4 3 4m8-8c2 0 3 2 3 4s-1 4-3 4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.5-1.5-4-1-4 2 0 2 1.5 3 4 3s4-1 4-3c0-3-2.5-3.5-4-2Z"
      />
    </svg>
  );
}

function IconTrauma(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 20 7v6c0 4.4-3.4 8.5-8 9-4.6-.5-8-4.6-8-9V7l8-4Z" />
      <path strokeLinecap="round" d="M12 8v8M9 11h6" />
    </svg>
  );
}

function IconConstitutional(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="7" r="3" />
      <path strokeLinecap="round" d="M6 21v-2a6 6 0 0 1 12 0v2" />
      <path strokeLinecap="round" d="M12 10v3" />
    </svg>
  );
}

function IconEnt(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function IconHeart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-6-4.2-6-9a3.5 3.5 0 0 1 6-2 3.5 3.5 0 0 1 6 2c0 4.8-6 9-6 9Z"
      />
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

function IconGi(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6c0 2 1 3 4 3s4-1 4-3-1-4-4-4-4 2-4 4Z"
      />
      <path strokeLinecap="round" d="M12 9v11M9 16c0 2 1.3 3 3 3s3-1 3-3" />
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

function IconBone(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
      <path strokeLinecap="round" d="M10.5 11h3M10.5 13h3" />
    </svg>
  );
}

function IconNeuro(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
    </svg>
  );
}

function IconSkin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" d="M12 3c4 2 7 5 7 9a7 7 0 1 1-14 0c0-4 3-7 7-9Z" />
      <path strokeLinecap="round" d="M8 14c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" />
    </svg>
  );
}

function IconMind(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M8 21c.5-3 2-5 4-5s3.5 2 4 5" />
      <path strokeLinecap="round" d="M9 8h.01M15 8h.01" />
    </svg>
  );
}

function IconEndocrine(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" d="M6 18V6M12 18V4M18 18v-8" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="18" cy="10" r="2" />
    </svg>
  );
}

function IconVitalSigns(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" d="M4 19h4l2-7 4 14 2-7h4" />
    </svg>
  );
}

function IconStethoscope(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v8a4 4 0 0 0 8 0V4" />
      <path strokeLinecap="round" d="M6 8H4a2 2 0 0 0-2 2v1a5 5 0 0 0 5 5h1" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  );
}

function IconClipboard(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path strokeLinecap="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconLightbulb(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 22h4M8 14a4 4 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z" />
    </svg>
  );
}

function IconDefault(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v4l2 2" />
    </svg>
  );
}

const SECTION_ICONS: Record<string, ComponentType<IconProps>> = {
  consciencia: IconBrain,
  abdome: IconAbdomen,
  membros: IconLimb,
  respiratorio: IconLungsHeart,
  pele_trauma: IconTrauma,
  geral: IconConstitutional,
  ent: IconEnt,
  cardiovascular: IconHeart,
  respiratorio_comp: IconLungs,
  gastrointestinal: IconGi,
  geniturinario: IconDroplet,
  musculoesqueletico: IconBone,
  neurologico_comp: IconNeuro,
  pele_mucosas: IconSkin,
  psiquiatrico: IconMind,
  endocrino: IconEndocrine,
  vital_signs: IconVitalSigns,
  exam_findings: IconStethoscope,
  complementary_report: IconClipboard,
  clinical_suggestions: IconLightbulb,
};

export function T0SectionIcon({
  sectionId,
  className = "h-4 w-4",
  badgeClassName = "h-9 w-9 rounded-lg bg-navy-50 text-navy-700",
}: {
  sectionId: string;
  className?: string;
  badgeClassName?: string;
}) {
  const Icon = SECTION_ICONS[sectionId] ?? IconDefault;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${badgeClassName}`}
      aria-hidden="true"
    >
      <Icon className={className} />
    </span>
  );
}
