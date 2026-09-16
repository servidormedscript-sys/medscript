"use client";

import { useState } from "react";
import { STATUS_LABELS, SEX_LABELS } from "@/lib/types/patient";
import type { PatientStatus } from "@/lib/types/patient";
import { formatAge } from "@/lib/utils/age";
import PatientDocumentActions from "./PatientDocumentActions";
import StatusTimeDisplay from "./StatusTimeDisplay";

type PatientRecord = {
  id: string;
  full_name: string;
  cpf: string;
  birth_date?: string | null;
  sex?: "masculino" | "feminino" | "outro" | null;
  is_archived: boolean;
  patient_episodes?: {
    id: string;
    episode_number: number;
    status: string;
    diagnosis?: string | null;
    initial_assessment?: string | null;
    archived_at: string | null;
    created_at: string;
    patient_movements?: {
      to_status: string;
      report_text: string;
      created_at: string;
      duration_seconds?: number | null;
    }[];
    status_started_at?: string | null;
    triagem_seconds?: number;
    observacao_seconds?: number;
    internado_seconds?: number;
    alta_started_at?: string | null;
  }[];
};

import { formatCpf } from "@/lib/utils/cpf";

type PatientCadastroPanelProps = {
  onReactivated: () => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function PatientCadastroPanel({
  onReactivated,
}: PatientCadastroPanelProps) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelected(null);

    const res = await fetch(
      `/api/pacientes/buscar?q=${encodeURIComponent(query.trim())}&archived=true`
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro na busca.");
      return;
    }

    setPatients(data.patients ?? []);
  }

  async function handleReactivate(patientId: string) {
    setReactivating(patientId);
    setError(null);

    const res = await fetch(`/api/pacientes/${patientId}`, { method: "POST" });
    const data = await res.json();
    setReactivating(null);

    if (!res.ok) {
      setError(data.error ?? "Erro ao reativar paciente.");
      return;
    }

    onReactivated();
  }

  async function handleViewHistory(patientId: string) {
    const res = await fetch(`/api/pacientes/${patientId}`);
    const data = await res.json();
    if (res.ok) setSelected(data.patient);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-navy-900/8 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-navy-950">
          Desarquivar paciente
        </h2>
        <p className="mb-4 text-sm text-navy-800/65">
          Pesquise por nome completo ou CPF para reativar um paciente. Uma nova
          ficha será criada, mantendo o histórico anterior.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou CPF"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-md bg-navy-900 px-5 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>

      {patients.length > 0 && (
        <div className="rounded-lg border border-navy-900/8 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-navy-950">
            Resultados ({patients.length})
          </h3>
          <ul className="divide-y divide-navy-900/8">
            {patients.map((patient) => (
              <li
                key={patient.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
              >
                <div>
                  <p className="font-medium text-navy-950">{patient.full_name}</p>
                  <p className="text-sm text-navy-800/60">
                    CPF {formatCpf(patient.cpf)} · Arquivado
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewHistory(patient.id)}
                    className="rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50"
                  >
                    Ver histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReactivate(patient.id)}
                    disabled={reactivating === patient.id}
                    className="rounded-md bg-med-red px-3 py-1.5 text-xs font-medium text-white hover:bg-med-red-dark disabled:opacity-60"
                  >
                    {reactivating === patient.id ? "Reativando..." : "Reativar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-navy-900/8 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-navy-950">
                Histórico — {selected.full_name}
              </h3>
              {(selected.birth_date || selected.sex) && (
                <p className="mt-1 text-xs text-navy-800/55">
                  {[
                    selected.birth_date ? formatAge(selected.birth_date) : null,
                    selected.sex ? SEX_LABELS[selected.sex] : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PatientDocumentActions
                patientId={selected.id}
                patientName={selected.full_name}
                variant="panel"
                onError={setError}
              />
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-navy-800/50 hover:text-navy-800"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(selected.patient_episodes ?? [])
              .sort((a, b) => b.episode_number - a.episode_number)
              .map((episode) => (
                <div
                  key={episode.id}
                  className="rounded-md border border-navy-900/8 p-4"
                >
                  <p className="text-sm font-medium text-navy-950">
                    Ficha #{episode.episode_number} ·{" "}
                    {STATUS_LABELS[episode.status as keyof typeof STATUS_LABELS] ??
                      episode.status}
                  </p>
                  <p className="text-xs text-navy-800/50">
                    {new Date(episode.created_at).toLocaleDateString("pt-BR")}
                    {episode.archived_at &&
                      ` — Arquivada em ${new Date(episode.archived_at).toLocaleDateString("pt-BR")}`}
                  </p>
                  {episode.diagnosis && (
                    <p className="mt-2 text-xs text-navy-800/65">
                      Diagnóstico: {episode.diagnosis}
                    </p>
                  )}

                  <div className="mt-3">
                    <StatusTimeDisplay
                      episode={{
                        status: episode.status as PatientStatus,
                        status_started_at:
                          episode.status_started_at ?? episode.created_at,
                        triagem_seconds: episode.triagem_seconds ?? 0,
                        observacao_seconds: episode.observacao_seconds ?? 0,
                        internado_seconds: episode.internado_seconds ?? 0,
                        alta_started_at: episode.alta_started_at ?? null,
                      }}
                      compact
                      showAccumulated
                    />
                  </div>

                  {episode.initial_assessment && (
                    <p className="mt-2 rounded border border-navy-900/8 bg-navy-50/50 p-2 text-xs text-navy-800/70">
                      <span className="font-medium">T0:</span>{" "}
                      {episode.initial_assessment}
                    </p>
                  )}

                  {(episode.patient_movements ?? []).length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-navy-900/8 pt-3">
                      {(episode.patient_movements ?? [])
                        .sort(
                          (a, b) =>
                            new Date(a.created_at).getTime() -
                            new Date(b.created_at).getTime()
                        )
                        .map((mov, idx) => (
                          <li key={idx} className="text-xs text-navy-800/70">
                            <span className="font-medium text-navy-800">
                              {STATUS_LABELS[mov.to_status as keyof typeof STATUS_LABELS] ??
                                mov.to_status}
                            </span>
                            {mov.report_text && ` — ${mov.report_text}`}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
