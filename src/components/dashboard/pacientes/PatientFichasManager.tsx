"use client";

import { useCallback, useEffect, useState } from "react";
import type { KanbanEpisode, Patient, PatientEpisode } from "@/lib/types/patient";
import { STATUS_LABELS } from "@/lib/types/patient";
import { formatCpf } from "@/lib/utils/cpf";
import EditPatientFichaModal from "./EditPatientFichaModal";
import PatientDocumentActions from "./PatientDocumentActions";
import PatientFichaViewModal from "./PatientFichaViewModal";

type EpisodeRecord = PatientEpisode & {
  archived_at: string | null;
};

type PatientRecord = Patient & {
  patient_episodes?: EpisodeRecord[];
};

function getActiveEpisode(patient: PatientRecord): EpisodeRecord | null {
  const episodes = patient.patient_episodes ?? [];
  return (
    episodes.find((ep) => !ep.archived_at && ep.status !== "arquivado") ??
    null
  );
}

export default function PatientFichasManager() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [viewEpisode, setViewEpisode] = useState<
    (KanbanEpisode | (PatientEpisode & { patient: Patient })) | null
  >(null);
  const [editEpisode, setEditEpisode] = useState<
    (KanbanEpisode | (PatientEpisode & { patient: Patient })) | null
  >(null);

  const loadPatients = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ active: "true" });
    if (searchQuery?.trim()) {
      params.set("q", searchQuery.trim());
    }

    const res = await fetch(`/api/pacientes/buscar?${params.toString()}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar pacientes.");
      return;
    }

    setPatients(data.patients ?? []);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await loadPatients(query);
  }

  function openView(patient: PatientRecord) {
    const episode = getActiveEpisode(patient);
    if (!episode) {
      setError("Este paciente não possui ficha ativa.");
      return;
    }
    setViewEpisode({ ...episode, patient });
  }

  function openEdit(patient: PatientRecord) {
    const episode = getActiveEpisode(patient);
    if (!episode) {
      setError("Este paciente não possui ficha ativa.");
      return;
    }
    setEditEpisode({ ...episode, patient });
  }

  const inputClass =
    "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-navy-900/8 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-navy-950">
          Fichas cadastrais
        </h2>
        <p className="mb-4 text-sm text-navy-800/65">
          Pacientes ativos no Kanban. Use a busca para filtrar por nome ou CPF.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nome ou CPF"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-md bg-navy-900 px-5 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? "Carregando..." : "Buscar"}
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                loadPatients();
              }}
              className="shrink-0 rounded-md border border-navy-900/12 px-4 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-navy-900/8 bg-white p-6">
        <h3 className="mb-4 text-sm font-medium text-navy-950">
          Pacientes ativos ({patients.length})
        </h3>

        {loading ? (
          <p className="text-sm text-navy-800/60">Carregando pacientes...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-navy-800/60">
            {query.trim()
              ? "Nenhum paciente encontrado para esta busca."
              : "Nenhum paciente ativo. Cadastre um paciente em Relatório de Pacientes."}
          </p>
        ) : (
          <ul className="divide-y divide-navy-900/8">
            {patients.map((patient) => {
              const episode = getActiveEpisode(patient);
              return (
                <li
                  key={patient.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-navy-950">
                      {patient.full_name}
                    </p>
                    <p className="text-sm text-navy-800/60">
                      CPF {formatCpf(patient.cpf)}
                      {episode &&
                        ` · Ficha #${episode.episode_number} · ${STATUS_LABELS[episode.status]}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openView(patient)}
                      disabled={!episode}
                      className="rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50 disabled:opacity-40"
                    >
                      Ver ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(patient)}
                      disabled={!episode}
                      className="rounded-md bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800 disabled:opacity-40"
                    >
                      Editar
                    </button>
                    {episode && (
                      <PatientDocumentActions
                        patientId={patient.id}
                        episodeId={episode.id}
                        patientName={patient.full_name}
                        onError={(text) => {
                          setError(text);
                          setMessage(null);
                        }}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {viewEpisode && (
        <PatientFichaViewModal
          episode={viewEpisode}
          onClose={() => setViewEpisode(null)}
          onEdit={() => {
            setEditEpisode(viewEpisode);
            setViewEpisode(null);
          }}
        />
      )}

      {editEpisode && (
        <EditPatientFichaModal
          episode={editEpisode}
          onClose={() => setEditEpisode(null)}
          onSaved={() => {
            setEditEpisode(null);
            setMessage("Ficha atualizada com sucesso.");
            setError(null);
            loadPatients(query);
          }}
          onError={(text) => {
            setError(text);
            setMessage(null);
          }}
        />
      )}
    </div>
  );
}
