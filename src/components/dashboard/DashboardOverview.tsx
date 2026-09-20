"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import NewPatientModal from "@/components/dashboard/pacientes/NewPatientModal";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import { meuPacienteGraveT0Url } from "@/lib/dashboard/meu-paciente-grave-url";
import type { DashboardOverview, KanbanColumnStatus } from "@/lib/dashboard/overview";
import {
  RISK_LABELS,
  STATUS_LABELS,
  formatMedicationAlertTime,
  formatMedicationDateTime,
} from "@/lib/dashboard/overview";
import { CLINICAL_PROTOCOLS } from "@/lib/clinical/protocols/catalog";
import { KANBAN_COLUMNS } from "@/lib/types/patient";

const QUICK_PROTOCOLS = ["pcr-adulto", "anafilaxia", "isr", "sca"] as const;

const cardClass = "rounded-lg border border-navy-900/8 bg-white p-5 shadow-sm";

const KANBAN_STATUS_STYLES: Record<
  KanbanColumnStatus,
  { card: string; label: string; count: string; dot: string }
> = {
  triagem: {
    card: "border-ocean-200 bg-ocean-50/80 hover:border-ocean-300 hover:bg-ocean-50",
    label: "text-ocean-800/80",
    count: "text-ocean-950",
    dot: "bg-ocean-500",
  },
  em_observacao: {
    card: "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50",
    label: "text-amber-800/80",
    count: "text-amber-950",
    dot: "bg-amber-500",
  },
  internado: {
    card: "border-navy-100 bg-navy-50/80 hover:border-navy-200 hover:bg-navy-50",
    label: "text-navy-800/80",
    count: "text-navy-950",
    dot: "bg-navy-600",
  },
  alta_recente: {
    card: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50",
    label: "text-emerald-800/80",
    count: "text-emerald-950",
    dot: "bg-emerald-500",
  },
};

const QUICK_ACTION_STYLES = [
  "border-ocean-200 bg-ocean-50 text-ocean-950 hover:bg-ocean-100 [&_span]:text-ocean-800/70",
  "border-navy-100 bg-navy-50 text-navy-900 hover:bg-navy-100 [&_span]:text-navy-700/70",
  "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 [&_span]:text-emerald-800/70",
  "border-ocean-200 bg-ocean-50 text-ocean-950 hover:bg-ocean-100 [&_span]:text-ocean-800/70",
] as const;

const PROTOCOL_CHIP_STYLES = [
  "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
  "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
] as const;

const emptyOverview: DashboardOverview = {
  kanban_counts: {
    triagem: 0,
    em_observacao: 0,
    internado: 0,
    alta_recente: 0,
  },
  total_active: 0,
  medication_alerts: [],
  risk_patients: [],
  triagem_patients: [],
};

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<DashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar dashboard.");
        return;
      }

      setData({
        ...emptyOverview,
        ...json,
        kanban_counts: {
          ...emptyOverview.kanban_counts,
          ...(json.kanban_counts ?? {}),
        },
      });
    } catch {
      setError("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useClinicRealtime(loadOverview);

  const quickProtocols = CLINICAL_PROTOCOLS.filter((protocol) =>
    QUICK_PROTOCOLS.includes(protocol.id as (typeof QUICK_PROTOCOLS)[number])
  );

  const quickActions = [
    {
      href: "/dashboard/meu-paciente-grave",
      title: "T0 rápido",
      subtitle: "Abrir Meu Paciente Grave",
      kind: "link" as const,
    },
    {
      href: "/dashboard/protocolos-clinicos",
      title: "Protocolos clínicos",
      subtitle: "Ver protocolos assistenciais",
      kind: "link" as const,
    },
    {
      title: "Cadastrar paciente",
      subtitle: "Entra direto na triagem",
      kind: "button" as const,
      onClick: () => setShowNewPatient(true),
    },
    {
      href: "/dashboard/relatorio-pacientes",
      title: "Kanban completo",
      subtitle: "Relatório de pacientes",
      kind: "link" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className={`${cardClass} border-l-4 border-l-navy-600 bg-gradient-to-r from-navy-50/40 to-white`}>
        <h2 className="text-sm font-medium text-navy-950">Ações rápidas</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => {
            const className = `rounded-md border px-4 py-3 text-sm font-medium transition-colors ${QUICK_ACTION_STYLES[index]}`;

            if (action.kind === "button") {
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={action.onClick}
                  className={`${className} text-left`}
                >
                  {action.title}
                  <span className="mt-1 block text-xs font-normal">{action.subtitle}</span>
                </button>
              );
            }

            return (
              <Link key={action.title} href={action.href} className={className}>
                {action.title}
                <span className="mt-1 block text-xs font-normal">{action.subtitle}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickProtocols.map((protocol, index) => (
            <Link
              key={protocol.id}
              href={`/dashboard/protocolos-clinicos?category=${protocol.categoryId}&protocol=${protocol.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${PROTOCOL_CHIP_STYLES[index % PROTOCOL_CHIP_STYLES.length]}`}
            >
              {protocol.name}
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className={`${cardClass} border-l-4 border-l-ocean-400 bg-gradient-to-r from-ocean-50/30 to-white`}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-navy-950">Pacientes no Kanban</h2>
            <p className="text-sm text-navy-800/60">
              {loading
                ? "Carregando..."
                : `${data.total_active} paciente(s) ativo(s) no fluxo assistencial`}
            </p>
          </div>
          <Link
            href="/dashboard/relatorio-pacientes"
            className="text-sm font-medium text-ocean-800 hover:text-ocean-950"
          >
            Ver Kanban →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KANBAN_COLUMNS.map((status) => {
            const styles = KANBAN_STATUS_STYLES[status as KanbanColumnStatus];

            return (
            <Link
              key={status}
              href="/dashboard/relatorio-pacientes"
              className={`rounded-md border p-4 transition-colors ${styles.card}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                <p className={`text-xs uppercase tracking-wide ${styles.label}`}>
                  {STATUS_LABELS[status]}
                </p>
              </div>
              <p className={`mt-2 text-3xl font-semibold ${styles.count}`}>
                {loading ? "—" : data.kanban_counts[status as KanbanColumnStatus]}
              </p>
            </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${cardClass} border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/30 to-white`}>
          <h2 className="text-lg font-medium text-navy-950">
            Medicamentos nos próximos momentos
          </h2>
          <p className="mt-1 text-sm text-navy-800/60">
            Próximas 2 horas ou doses em atraso
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-navy-800/60">Carregando...</p>
          ) : data.medication_alerts.length === 0 ? (
            <p className="mt-4 text-sm text-navy-800/60">
              Nenhuma dose prevista para os próximos momentos.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.medication_alerts.map((alert) => (
                <li
                  key={`${alert.episode_id}-${alert.medication}-${alert.due_at}`}
                  className={`rounded-md border px-4 py-3 ${
                    alert.is_overdue
                      ? "border-red-200 bg-red-50/70"
                      : "border-amber-200 bg-amber-50/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-navy-950">
                        {alert.patient_name}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-800/65">
                        {alert.medication}
                        {alert.bed ? ` · Leito ${alert.bed}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-navy-800/55">
                        {STATUS_LABELS[alert.status]} ·{" "}
                        {formatMedicationDateTime(new Date(alert.due_at))}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        alert.is_overdue
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {alert.is_overdue ? "Atraso" : "Próxima"} ·{" "}
                      {formatMedicationAlertTime(alert)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} border-l-4 border-l-rose-400 bg-gradient-to-r from-rose-50/30 to-white`}>
          <h2 className="text-lg font-medium text-navy-950">
            Pacientes em alto e médio risco
          </h2>
          <p className="mt-1 text-sm text-navy-800/60">
            Priorize a atenção clínica nestes casos
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-navy-800/60">Carregando...</p>
          ) : data.risk_patients.length === 0 ? (
            <p className="mt-4 text-sm text-navy-800/60">
              Nenhum paciente classificado com alto ou médio risco.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.risk_patients.map((patient) => (
                <li
                  key={patient.episode_id}
                  className={`rounded-md border px-4 py-3 ${
                    patient.risk_level === "alto"
                      ? "border-red-200 bg-red-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-navy-950">
                        {patient.patient_name}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-800/65">
                        {STATUS_LABELS[patient.status]}
                        {patient.bed ? ` · Leito ${patient.bed}` : ""}
                      </p>
                      {patient.diagnosis && (
                        <p className="mt-1 line-clamp-2 text-xs text-navy-800/70">
                          {patient.diagnosis}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        patient.risk_level === "alto"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {RISK_LABELS[patient.risk_level]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!loading && data.triagem_patients.length > 0 && (
        <section className={`${cardClass} border-l-4 border-l-ocean-400 bg-gradient-to-r from-ocean-50/30 to-white`}>
          <h2 className="text-lg font-medium text-navy-950">Triagem aguardando T0</h2>
          <p className="mt-1 text-sm text-navy-800/60">
            Acesso rápido para iniciar avaliação inicial
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {data.triagem_patients.map((patient) => (
              <button
                key={patient.episode_id}
                type="button"
                onClick={() => router.push(meuPacienteGraveT0Url(patient.episode_id))}
                className="rounded-md border border-ocean-200 bg-ocean-50 px-3 py-2 text-left text-sm text-ocean-950 transition-colors hover:bg-ocean-100"
              >
                {patient.patient_name}
                {patient.bed ? ` · Leito ${patient.bed}` : ""}
              </button>
            ))}
          </ul>
        </section>
      )}

      {showNewPatient && (
        <NewPatientModal
          lockInitialStatus="triagem"
          onClose={() => setShowNewPatient(false)}
          onCreated={() => {
            setShowNewPatient(false);
            loadOverview();
          }}
          onError={(text) => setError(text)}
        />
      )}
    </div>
  );
}
