import BrandLogo from "@/components/BrandLogo";
import SupportRequestButton from "@/components/support/SupportRequestButton";
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
                Criar conta
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-ocean-800 px-6 text-sm font-semibold text-ocean-800 transition-colors hover:bg-ocean-50"
              >
                Já tenho uma conta
              </Link>
              <SupportRequestButton variant="landing" />
            </div>
          </div>

          <div className="relative mx-auto flex w-full justify-center py-4 md:py-5">
            <div className="relative h-[280px] w-[280px] shrink-0 md:h-[340px] md:w-[340px]">
              <div
                className="pointer-events-none absolute inset-0 rounded-full bg-med-red/25 ring-2 ring-med-red/20"
                aria-hidden="true"
              />
              <div className="relative z-10 flex h-full w-full items-center justify-center">                <BrandLogo size="hero" priority />
              </div>
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
