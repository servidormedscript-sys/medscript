import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

const stats = [
  { value: "24/7", label: "Operação contínua" },
  { value: "6+", label: "Módulos clínicos" },
  { value: "LGPD", label: "Dados protegidos" },
];

export default function Hero() {
  return (
    <>
      <section
        id="inicio"
        className="overflow-visible bg-ocean-100 pb-10 pt-10 md:pb-14 md:pt-14 lg:pb-16 lg:pt-16"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-navy-900 md:text-5xl lg:text-[3.25rem]">
              Gestão clínica do seu{" "}
              <span className="relative inline-block text-ocean-800">
                plantão
                <span
                  className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-ocean-300/60"
                  aria-hidden="true"
                />
              </span>{" "}
              ao prontuário
            </h1>

            <p className="mt-6 text-base leading-relaxed text-navy-800/65 md:text-lg">
              T0, Kanban, protocolos assistenciais e alertas de medicamento em
              uma plataforma simples, pensada para equipes de emergência e
              plantão hospitalar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex h-11 items-center justify-center rounded-full bg-ocean-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-ocean-700"
              >
                Começar agora
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-ocean-800 px-6 text-sm font-semibold text-ocean-800 transition-colors hover:bg-ocean-50"
              >
                Já tenho uma conta
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[260px] w-full items-center justify-center py-4 md:min-h-[300px] md:py-5">
            <div
              className="hero-logo-glow pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] rounded-full bg-med-red/40 shadow-[0_0_60px_20px_rgba(215,38,56,0.18)] md:h-[340px] md:w-[340px]"
              aria-hidden="true"
            />
            <div
              className="hero-logo-ring pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] rounded-full border-2 border-med-red/35 bg-med-red/15 md:h-[340px] md:w-[340px]"
              aria-hidden="true"
            />
            <div
              className="hero-logo-ring hero-logo-ring-delay pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] rounded-full border-2 border-med-red/25 bg-med-red/10 md:h-[340px] md:w-[340px]"
              aria-hidden="true"
            />
            <div className="relative z-10 flex justify-center">
              <BrandLogo size="hero" priority />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-0 bg-ocean-500">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((item) => (
            <div key={item.label} className="px-6 py-8 text-center text-white">
              <p className="text-2xl font-bold md:text-3xl">{item.value}</p>
              <p className="mt-1 text-sm text-white/75">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
