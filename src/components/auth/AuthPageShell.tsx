import AuthPageBackground from "@/components/auth/AuthPageBackground";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  alternateLabel: string;
  alternateHref: string;
  alternateLinkText: string;
  fixedViewport?: boolean;
  logoClassName?: string;
  children: React.ReactNode;
};

export default function AuthPageShell({
  title,
  subtitle,
  alternateLabel,
  alternateHref,
  alternateLinkText,
  fixedViewport = false,
  logoClassName,
  children,
}: AuthPageShellProps) {
  const shellClass = fixedViewport
    ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
    : "flex min-h-dvh flex-col";

  const mainClass = fixedViewport
    ? "flex flex-1 items-center justify-center overflow-hidden px-4 py-3 sm:px-6"
    : "flex flex-1 items-center justify-center px-4 py-8 sm:px-6";

  return (
    <AuthPageBackground>
      <div className={shellClass}>
        <main className={mainClass}>
          <div
            className={`flex w-full max-w-md flex-col items-center ${
              fixedViewport ? "gap-2 sm:gap-3" : "gap-6"
            }`}
          >
            <Link href="/" className="shrink-0">
              <BrandLogo
                size="hero"
                variant="white"
                glow
                priority
                className={
                  logoClassName ??
                  (fixedViewport
                    ? "h-16 w-auto sm:h-20"
                    : "h-20 w-auto sm:h-24")
                }
              />
            </Link>

            <div className="text-center">
              <h1
                className={`font-bold text-white ${
                  fixedViewport ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
                }`}
              >
                {title}
              </h1>
              <p
                className={`text-white/65 ${
                  fixedViewport
                    ? "mt-0.5 text-[11px] sm:text-xs"
                    : "mt-1 text-sm"
                }`}
              >
                {subtitle}
              </p>
            </div>

            <div className="w-full shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-xl shadow-black/20 backdrop-blur-sm">
              {children}
            </div>

            <div
              className={`text-center text-white/70 ${
                fixedViewport ? "text-[11px] sm:text-xs" : "space-y-2 text-sm"
              }`}
            >
              <p>
                {alternateLabel}{" "}
                <Link
                  href={alternateHref}
                  className="font-medium text-white transition-colors hover:text-ocean-200"
                >
                  {alternateLinkText}
                </Link>
                {fixedViewport ? (
                  <>
                    <span className="mx-1.5 text-white/30">·</span>
                    <Link
                      href="/"
                      className="text-white/45 transition-colors hover:text-white/75"
                    >
                      Voltar ao site
                    </Link>
                  </>
                ) : null}
              </p>
              {!fixedViewport ? (
                <p>
                  <Link
                    href="/"
                    className="text-white/45 transition-colors hover:text-white/75"
                  >
                    Voltar ao site
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </AuthPageBackground>
  );
}
