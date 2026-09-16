"use client";

import { IconCheck } from "@/components/icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const reasons = [
  {
    title: "Menos tempo perdido no plantão",
    text: "Kanban, T0 e protocolos no mesmo painel reduzem buscas em PDFs, planilhas e grupos de mensagem.",
  },
  {
    title: "Decisão clínica mais segura",
    text: "Protocolos assistenciais com calculadoras de dose ajudam a padronizar condutas em emergências e UTI.",
  },
  {
    title: "Equipe alinhada em tempo real",
    text: "Alertas de medicamento, plantões agendados e documentos da clínica mantêm todos na mesma página.",
  },
  {
    title: "Feito para quem vive o hospital",
    text: "Pensado para triagem, observação, internação e paciente grave. Não é um prontuário genérico.",
  },
];

const plan = {
  name: "Profissional",
  badge: "Plano completo",
  price: "R$ 149",
  period: "/ mês por clínica",
  trial: "14 dias de avaliação gratuita",
  description:
    "Acesso total à plataforma para administrador e sub-usuários da sua equipe, sem limite de módulos.",
  features: [
    "Dashboard com Kanban, alertas e ações rápidas",
    "Meu Paciente Grave com T0 estruturado",
    "Biblioteca de protocolos clínicos com calculadoras",
    "Relatório de pacientes e fluxo assistencial",
    "Agenda de plantões com notificações",
    "Documentações institucionais da clínica",
    "Organização clínica e gestão de sub-usuários",
    "Exportação de fichas e laudos com logo MEDScript",
  ],
};

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="precos"
      ref={sectionRef}
      className={`py-16 md:py-20 ${visible ? "pricing-visible" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="pricing-rise mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">
            Por que investir no MEDScript?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-800/65 md:text-base">
            Plantões pedem velocidade, padronização e comunicação clara. O MEDScript
            junta num só lugar o que hoje fica espalhado em ferramentas diferentes,
            com foco em emergência e cuidado crítico.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <p className="pricing-rise pricing-rise-1 text-sm leading-relaxed text-navy-800/70 md:text-base">
              Cada minuto no plantão conta. Quando triagem, medicamentos, protocolos
              e plantões ficam separados, sobra atraso, retrabalho e ruído na
              comunicação. O MEDScript centraliza esse fluxo para você decidir
              mais rápido e registrar com segurança.
            </p>

            <ul className="space-y-4">
              {reasons.map((reason, index) => (
                <li
                  key={reason.title}
                  className={`pricing-rise pricing-rise-${index + 2} group rounded-2xl border border-ocean-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-ocean-300 hover:shadow-md hover:shadow-ocean-900/10`}
                >
                  <h3 className="text-sm font-semibold text-navy-900 transition-colors group-hover:text-ocean-800">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-800/65">
                    {reason.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="pricing-rise pricing-rise-6 lg:sticky lg:top-8">
            <div className="pricing-plan-card relative overflow-hidden rounded-3xl border border-ocean-200 bg-white">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-ocean-200/30 blur-2xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-med-red/10 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative border-b border-ocean-100 bg-ocean-50/80 px-6 py-4 text-center">
                <span className="inline-block rounded-full bg-ocean-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition-transform duration-300 hover:scale-105">
                  {plan.badge}
                </span>
                <h3 className="mt-3 text-2xl font-bold text-navy-900">
                  Plano {plan.name}
                </h3>
                <p className="mt-2 text-sm text-navy-800/60">{plan.description}</p>
              </div>

              <div className="relative px-6 py-6 text-center">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-navy-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-navy-800/55">{plan.period}</span>
                </div>

                <p className="pricing-trial-badge mt-4 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-medium text-emerald-900">
                  {plan.trial}. Sem compromisso.
                </p>

                <ul className="mt-6 space-y-3 text-left">
                  {plan.features.map((feature, index) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-navy-800/75 transition-all duration-300 hover:translate-x-1 hover:text-navy-900"
                      style={{ transitionDelay: `${index * 20}ms` }}
                    >
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-ocean-800" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/cadastro"
                  className="pricing-cta mt-8 inline-block w-full rounded-full bg-ocean-800 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-ocean-700 active:scale-[0.98]"
                >
                  Iniciar avaliação gratuita de 14 dias
                </Link>

                <p className="mt-4 text-xs leading-relaxed text-navy-800/45">
                  Cancele quando quiser. Depois do teste, a cobrança é mensal e
                  você mantém todo o histórico da clínica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
