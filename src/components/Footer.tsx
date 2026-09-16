import BrandLogo from "@/components/BrandLogo";
import { MEDSCRIPT_INSTAGRAM_URL } from "@/lib/branding";
import { footerLegalLinks } from "@/lib/legal/documents";
import Link from "next/link";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Divider() {
  return (
    <span
      className="hidden h-4 w-px shrink-0 bg-white/15 sm:block"
      aria-hidden="true"
    />
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-ocean-950/30 bg-gradient-to-b from-ocean-900 to-ocean-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
          <Link href="/" className="shrink-0">
            <BrandLogo size="footer" variant="white" className="h-8 w-auto" />
          </Link>

          <Divider />

          <a
            href={MEDSCRIPT_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-white/65 transition-colors hover:text-white"
          >
            <InstagramIcon className="h-4 w-4" />
            @medscript.app
          </a>

          <Divider />

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-[12px] text-white/55 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Divider />

          <Link href="/" className="shrink-0">
            <BrandLogo size="footer" variant="white" className="h-8 w-auto" />
          </Link>
        </div>

        <p className="mt-4 border-t border-white/[0.07] pt-4 text-[11px] text-white/35">
          © {new Date().getFullYear()} MEDScript. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
