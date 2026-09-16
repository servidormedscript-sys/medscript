import Image from "next/image";
import {
  MEDSCRIPT_LOGO_ALT,
  MEDSCRIPT_LOGO_PATH,
  MEDSCRIPT_LOGO_WHITE_PATH,
} from "@/lib/branding";

type BrandLogoSize = "header" | "sidebar" | "footer" | "hero";

const sizeConfig: Record<
  BrandLogoSize,
  { width: number; height: number; className: string }
> = {
  header: {
    width: 140,
    height: 56,
    className: "h-10 w-auto object-contain",
  },
  sidebar: {
    width: 220,
    height: 88,
    className: "h-16 w-auto object-contain sm:h-[4.75rem]",
  },
  footer: {
    width: 130,
    height: 52,
    className: "h-10 w-auto object-contain",
  },
  hero: {
    width: 320,
    height: 128,
    className: "h-32 w-auto object-contain md:h-40",
  },
};

type BrandLogoProps = {
  size?: BrandLogoSize;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  size = "header",
  variant = "default",
  glow = false,
  className = "",
  priority = false,
}: BrandLogoProps) {
  const config = sizeConfig[size];
  const src =
    variant === "white" ? MEDSCRIPT_LOGO_WHITE_PATH : MEDSCRIPT_LOGO_PATH;

  const image = (
    <Image
      src={src}
      alt={MEDSCRIPT_LOGO_ALT}
      width={config.width}
      height={config.height}
      className={`${config.className} ${className} ${glow ? "relative z-10" : ""}`.trim()}
      priority={priority}
    />
  );

  if (!glow) {
    return image;
  }

  const glowClass =
    variant === "white"
      ? "bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0%,rgba(215,38,56,0.15)_45%,transparent_72%)]"
      : "bg-[radial-gradient(circle,rgba(61,136,173,0.35)_0%,rgba(215,38,56,0.12)_50%,transparent_72%)]";

  return (
    <span className="relative inline-flex items-center justify-center">
      <span
        className={`logo-glow-pulse pointer-events-none absolute inset-0 scale-110 blur-2xl ${glowClass}`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute inset-0 scale-125 blur-3xl opacity-40 ${glowClass}`}
        aria-hidden="true"
      />
      {image}
    </span>
  );
}
