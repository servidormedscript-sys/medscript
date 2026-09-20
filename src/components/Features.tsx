"use client";

import {
  IconCalendar,
  IconChart,
  IconFileText,
  IconPrescription,
  IconShield,
} from "@/components/icons";
import { PROTOCOL_CATEGORIES } from "@/lib/clinical/protocols/categories";
import { useState } from "react";

const modules = [
  {
    id: "dashboard",
    icon: IconChart,
    title: "Dashboard",
    description: "Kanban, alertas e ações rápidas do plantão.",
  },
  {
    id: "t0",
    icon: IconFileText,
    title: "Paciente Grave",
    description: "T0 estruturado e laudos avulsos.",
  },
  {
    id: "protocolos",
    icon: IconPrescription,
    title: "Protocolos",
    description: "Biblioteca assistencial com calculadoras.",
  },
  {
    id: "plantoes",
    icon: IconCalendar,
    title: "Plantões",
    description: "Agenda da equipe com notificações.",
  },
  {
    id: "documentos",
    icon: IconShield,
    title: "Documentos",
    description: "Arquivos institucionais seguros.",
  },
] as const;

const quickProtocols = [
  { name: "PCR em Adulto", className: "border-red-200 bg-red-50 text-red-800" },
  { name: "Anafilaxia", className: "border-orange-200 bg-orange-50 text-orange-800" },
  { name: "Intubação de Sequência Rápida", className: "border-blue-200 bg-blue-50 text-blue-800" },
  { name: "SCA sem supra", className: "border-rose-200 bg-rose-50 text-rose-800" },
];

const kanbanColumns = [
  { label: "Triagem", count: 3, dot: "bg-ocean-500", card: "border-ocean-200 bg-ocean-50/80" },
  { label: "Em observação", count: 5, dot: "bg-amber-500", card: "border-amber-200 bg-amber-50/80" },
  { label: "Internado", count: 2, dot: "bg-navy-600", card: "border-navy-100 bg-navy-50/80" },
  { label: "Alta recente", count: 1, dot: "bg-emerald-500", card: "border-emerald-200 bg-emerald-50/80" },
];

const previewCategories = PROTOCOL_CATEGORIES.slice(0, 4);

function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-ocean-100 bg-ocean-50/40 p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-navy-800/45">Prévia do painel MEDScript</span>
      </div>
      <div className="rounded-2xl border border-navy-900/8 bg-white p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <PreviewShell>
      <p className="text-xs font-medium uppercase tracking-wide text-navy-800/50">
        Ações rápidas
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "T0 rápido", sub: "Meu Paciente Grave", style: "border-ocean-200 bg-ocean-50 text-ocean-950" },
          { title: "Protocolos clínicos", sub: "Biblioteca assistencial", style: "border-navy-100 bg-navy-50 text-navy-900" },
          { title: "Cadastrar paciente", sub: "Entra na triagem", style: "border-emerald-200 bg-emerald-50 text-emerald-950" },
          { title: "Kanban completo", sub: "Relatório de pacientes", style: "border-ocean-200 bg-ocean-50 text-ocean-950" },
        ].map((action) => (
          <div
            key={action.title}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${action.style}`}
          >
            {action.title}
            <span className="mt-0.5 block text-xs font-normal opacity-70">{action.sub}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickProtocols.map((protocol) => (
          <span
            key={protocol.name}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${protocol.className}`}
          >
            {protocol.name}
          </span>
        ))}
      </div>

      <div className="mt-6 border-t border-navy-900/6 pt-5">
        <p className="text-sm font-medium text-navy-950">Pacientes no Kanban</p>
        <p className="text-xs text-navy-800/55">11 pacientes ativos no fluxo assistencial</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kanbanColumns.map((col) => (
            <div key={col.label} className={`rounded-xl border p-3 ${col.card}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <p className="text-[11px] uppercase tracking-wide text-navy-800/60">
                  {col.label}
                </p>
              </div>
              <p className="mt-1 text-2xl font-semibold text-navy-950">{col.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <p className="text-xs font-medium text-navy-950">Medicamentos — próximas 2h</p>
          <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2">
            <p className="text-sm font-medium text-navy-950">Maria S. · Leito 12</p>
            <p className="text-xs text-navy-800/60">Noradrenalina · Em observação</p>
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              Próxima · 18:30
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-3">
          <p className="text-xs font-medium text-navy-950">Alto e médio risco</p>
          <div className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-navy-950">João P.</p>
                <p className="text-xs text-navy-800/60">Internado · Leito 08</p>
                <p className="mt-1 text-xs text-navy-800/70">Sepse · choque séptico</p>
              </div>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
                Alto risco
              </span>
            </div>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function T0Preview() {
  return (
    <PreviewShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-950">Meu Paciente Grave — T0</p>
          <p className="text-xs text-navy-800/55">Carlos Mendes · Leito 04 · Triagem</p>
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-800">
          Alto risco
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "PA", value: "90/60 mmHg" },
          { label: "FC", value: "118 bpm" },
          { label: "SpO₂", value: "91%" },
          { label: "FR", value: "24 irpm" },
          { label: "Temp", value: "38,4 °C" },
          { label: "Glicemia", value: "142 mg/dL" },
        ].map((vital) => (
          <div
            key={vital.label}
            className="rounded-xl border border-navy-900/8 bg-navy-50/40 px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-navy-800/45">
              {vital.label}
            </p>
            <p className="text-sm font-medium text-navy-950">{vital.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-ocean-200 bg-ocean-50/50 p-3">
        <p className="text-xs font-medium text-ocean-900">Checklist assistencial</p>
        <ul className="mt-2 space-y-1.5">
          {[
            "Via aérea pérvia",
            "Acesso venoso calibroso",
            "Coleta laboratorial inicial",
            "Imagem conforme protocolo",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-navy-800/75">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-ocean-300 bg-white text-[10px] text-ocean-700">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg border border-navy-900/10 bg-white px-3 py-1.5 text-xs text-navy-800">
          Laudo avulso
        </span>
        <span className="rounded-lg bg-ocean-800 px-3 py-1.5 text-xs font-medium text-white">
          Salvar T0
        </span>
      </div>
    </PreviewShell>
  );
}

function ProtocolosPreview() {
  return (
    <PreviewShell>
      <p className="text-sm font-medium text-navy-950">Protocolos Clínicos</p>
      <p className="text-xs text-navy-800/55">
        Emergências, cardiologia, neurologia e mais — com calculadora de doses
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {previewCategories.map((category) => (
          <div
            key={category.id}
            className={`rounded-xl border bg-white p-3 ${category.borderClass}`}
          >
            <div
              className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold ${category.accentClass} ${category.borderClass}`}
            >
              {category.name.charAt(0)}
            </div>
            <p className="text-xs font-medium text-navy-950">{category.name}</p>
            <p className="mt-0.5 text-[10px] text-navy-800/50">10+ protocolos</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-red-200 bg-red-50/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-navy-950">PCR em Adulto</p>
            <p className="text-xs text-navy-800/60">
              Reanimação cardiopulmonar e drogas vasopressoras
            </p>
          </div>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
            Emergência
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-navy-900/8 bg-white px-3 py-2">
            <p className="text-[10px] text-navy-800/45">Peso do paciente</p>
            <p className="text-sm font-medium text-navy-950">72 kg</p>
          </div>
          <div className="rounded-lg border border-navy-900/8 bg-white px-3 py-2">
            <p className="text-[10px] text-navy-800/45">Adrenalina sugerida</p>
            <p className="text-sm font-medium text-ocean-800">1 mg IV — repetir a cada 3–5 min</p>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function PlantoesPreview() {
  return (
    <PreviewShell>
      <p className="text-sm font-medium text-navy-950">Agenda de Plantões</p>
      <p className="text-xs text-navy-800/55">Plantões atribuídos à equipe com aviso automático</p>

      <div className="mt-4 space-y-3">
        {[
          {
            date: "15 Set · 19:00 – 07:00",
            doctor: "Dra. Ana Lima",
            unit: "Emergência Adulto",
            status: "Confirmado",
            statusClass: "bg-emerald-100 text-emerald-800",
          },
          {
            date: "16 Set · 07:00 – 19:00",
            doctor: "Dr. Pedro Costa",
            unit: "UTI",
            status: "Novo plantão",
            statusClass: "bg-ocean-100 text-ocean-800",
          },
          {
            date: "17 Set · 19:00 – 07:00",
            doctor: "Dr. Gabriel R.",
            unit: "Emergência Pediátrica",
            status: "Agendado",
            statusClass: "bg-navy-100 text-navy-800",
          },
        ].map((shift) => (
          <div
            key={shift.date + shift.doctor}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-900/8 bg-navy-50/30 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-navy-950">{shift.doctor}</p>
              <p className="text-xs text-navy-800/60">
                {shift.date} · {shift.unit}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${shift.statusClass}`}
            >
              {shift.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-ocean-200 bg-ocean-50 px-4 py-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-800 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
        <div>
          <p className="text-xs font-medium text-ocean-900">Notificação de plantão</p>
          <p className="text-xs text-navy-800/65">
            Novo plantão atribuído — 16 Set, UTI, 07:00 às 19:00
          </p>
        </div>
      </div>
    </PreviewShell>
  );
}

function DocumentosPreview() {
  return (
    <PreviewShell>
      <p className="text-sm font-medium text-navy-950">Documentações</p>
      <p className="text-xs text-navy-800/55">
        Protocolos institucionais, POPs e materiais da clínica
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "Fluxo de sepse — adulto",
            desc: "POP atualizado · 3 anexos",
            locked: false,
          },
          {
            title: "Credenciais de acesso UTI",
            desc: "Documento privado · senha",
            locked: true,
          },
          {
            title: "Checklist de plantão noturno",
            desc: "Material interno · 1 anexo",
            locked: false,
          },
          {
            title: "Escalas de sedação",
            desc: "Referência clínica · 2 anexos",
            locked: false,
          },
        ].map((doc) => (
          <div
            key={doc.title}
            className="rounded-xl border border-navy-900/8 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy-950">{doc.title}</p>
                <p className="mt-1 text-xs text-navy-800/55">{doc.desc}</p>
              </div>
              {doc.locked ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                  Privado
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  Liberado
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

const previews: Record<(typeof modules)[number]["id"], () => React.ReactNode> = {
  dashboard: DashboardPreview,
  t0: T0Preview,
  protocolos: ProtocolosPreview,
  plantoes: PlantoesPreview,
  documentos: DocumentosPreview,
};

export default function Features() {
  const [active, setActive] = useState(0);
  const ActivePreview = previews[modules[active].id];

  return (
    <section id="vantagens" className="landing-section py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-2xl font-bold text-navy-900 md:text-3xl">
          Módulos clínicos integrados
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-navy-800/60 md:text-base">
          Veja como o painel organiza emergências, protocolos e o fluxo do plantão.
        </p>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-5 md:overflow-visible">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const isActive = active === index;

            return (
              <button
                key={module.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`min-w-[160px] shrink-0 rounded-2xl border p-5 text-left transition-all duration-200 md:min-w-0 ${
                  isActive
                    ? "border-ocean-800 bg-ocean-800 text-white shadow-md shadow-ocean-900/20"
                    : "border-navy-900/8 bg-white text-navy-900 hover:border-ocean-200 hover:shadow-sm"
                }`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                    isActive ? "bg-white/15 text-white" : "bg-ocean-50 text-ocean-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">{module.title}</h3>
                <p
                  className={`mt-2 text-xs leading-relaxed ${
                    isActive ? "text-white/80" : "text-navy-800/55"
                  }`}
                >
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>

        <ActivePreview />
      </div>
    </section>
  );
}
