"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  DISCHARGE_SUGGESTIONS,
  matchDischargeSuggestions,
} from "@/lib/clinical-rules/discharge-suggestions";
import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import {
  buildDischargeDraft,
  countPendingReconciliation,
} from "@/lib/inpatient/discharge-draft";
import type {
  EpisodeConduct,
  EpisodeDischarge,
  EpisodeEvolution,
  EpisodeImagingReport,
  EpisodeLabValue,
  EpisodeMedReconciliation,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import ClinicalStatusPanel from "./ClinicalStatusPanel";

type Props = {
  episodeId: string;
  episode: PatientEpisode;
  patient: Patient;
  discharge: EpisodeDischarge;
  pendingReconciliation: number;
  clinicalStatus: ClinicalStatusResult;
  vitals: EpisodeVitalRecord[];
  exams: EpisodePhysicalExam[];
  evolutions: EpisodeEvolution[];
  prescriptions: EpisodePrescription[];
  reconciliation: EpisodeMedReconciliation[];
  labValues: EpisodeLabValue[];
  imaging: EpisodeImagingReport[];
  conduct: EpisodeConduct | null;
  onDischargeChange: (d: EpisodeDischarge) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-navy-950 outline-none focus:border-navy-700";

export default function DischargeTab({
  episodeId,
  episode,
  patient,
  discharge,
  pendingReconciliation,
  clinicalStatus,
  vitals,
  exams,
  evolutions,
  prescriptions,
  reconciliation,
  labValues,
  imaging,
  conduct,
  onDischargeChange,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [altaDays, setAltaDays] = useState(7);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = Boolean(discharge.confirmed_at);
  const isInternado = episode.status === "internado";

  const matchedSuggestions = useMemo(
    () => matchDischargeSuggestions(episode.diagnosis),
    [episode.diagnosis],
  );

  const saveDraft = useCallback(
    async (patch: Partial<EpisodeDischarge>) => {
      if (isConfirmed || !isInternado) return;
      setSaving(true);
      setError(null);
      const next = { ...discharge, ...patch };
      const res = await fetch(`/api/pacientes/episodios/${episodeId}/alta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_text: next.summary_text,
          orientations_text: next.orientations_text,
          transfer_note: next.transfer_note,
        }),
      });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      onDischargeChange(data.discharge);
    },
    [discharge, episodeId, isConfirmed, isInternado, onDischargeChange],
  );

  function generateDraft() {
    const draft = buildDischargeDraft({
      patient,
      episode,
      vitalRecords: vitals,
      physicalExams: exams,
      evolutions,
      prescriptions,
      reconciliation,
      labValues,
      imagingReports: imaging,
      conductText: conduct?.conduct_text,
    });
    let orientations = draft.orientations;
    const pending = countPendingReconciliation(reconciliation);
    if (pending > 0) {
      orientations = `⚠ Reconciliação medicamentosa incompleta — ${pending} medicação(ões) de casa sem decisão.\n\n${orientations}`;
    }
    onDischargeChange({
      ...discharge,
      summary_text: draft.summary,
      orientations_text: orientations,
    });
    saveDraft({
      summary_text: draft.summary,
      orientations_text: orientations,
    });
  }

  function appendSuggestion(block: string, source: string) {
    const addition = `\n\n--- Sugestão (${source}) ---\n${block}`;
    const orientations = discharge.orientations_text.trim()
      ? `${discharge.orientations_text}${addition}`
      : block;
    onDischargeChange({ ...discharge, orientations_text: orientations });
    saveDraft({ orientations_text: orientations });
  }

  async function confirmDischarge() {
    setConfirming(true);
    setError(null);
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/alta/confirmar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alta_days: altaDays,
          summary_text: discharge.summary_text,
          orientations_text: discharge.orientations_text,
          transfer_note: discharge.transfer_note,
        }),
      },
    );
    const data = await res.json();
    setConfirming(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao confirmar alta.");
      return;
    }
    setMessage(
      "Alta confirmada. Paciente movido para Alta Recente (consultável por 7 dias ou prazo informado).",
    );
    router.push("/dashboard/relatorio-pacientes");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      {!isInternado && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Paciente não está em internação.{" "}
          {episode.status === "alta_recente"
            ? "Pode retornar a internado pelo Kanban dentro do prazo de alta recente."
            : "Documento de alta disponível apenas para consulta."}
        </p>
      )}

      {isConfirmed && (
        <p className="rounded-md border border-navy-900/10 bg-navy-50 px-3 py-2 text-sm text-navy-900">
          Alta confirmada em{" "}
          {new Date(discharge.confirmed_at!).toLocaleString("pt-BR")}.
        </p>
      )}

      <ClinicalStatusPanel status={clinicalStatus} compact />

      {pendingReconciliation > 0 && isInternado && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          ⚠ Reconciliação medicamentosa incompleta — {pendingReconciliation}{" "}
          medicação(ões) de casa sem decisão.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateDraft}
          disabled={isConfirmed || !isInternado || saving}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          ✨ Gerar rascunho automático
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy-950">
          Resumo de alta
        </label>
        <textarea
          rows={14}
          readOnly={isConfirmed || !isInternado}
          value={discharge.summary_text}
          onChange={(e) =>
            onDischargeChange({ ...discharge, summary_text: e.target.value })
          }
          onBlur={() => saveDraft({ summary_text: discharge.summary_text })}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy-950">
          Orientações
        </label>
        <textarea
          rows={10}
          readOnly={isConfirmed || !isInternado}
          value={discharge.orientations_text}
          onChange={(e) =>
            onDischargeChange({ ...discharge, orientations_text: e.target.value })
          }
          onBlur={() =>
            saveDraft({ orientations_text: discharge.orientations_text })
          }
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy-950">
          Situação de transferência (se aplicável)
        </label>
        <textarea
          rows={2}
          readOnly={isConfirmed || !isInternado}
          value={discharge.transfer_note}
          onChange={(e) =>
            onDischargeChange({ ...discharge, transfer_note: e.target.value })
          }
          onBlur={() => saveDraft({ transfer_note: discharge.transfer_note })}
          className={inputClass}
        />
      </div>

      {isInternado && !isConfirmed && (
        <div className="rounded-lg border border-navy-900/8 bg-white p-4">
          <h3 className="text-sm font-semibold text-navy-950">
            Sugestões por diagnóstico
          </h3>
          <p className="mt-1 text-xs text-navy-800/55">
            Um clique concatena nas orientações (não substitui o texto).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(matchedSuggestions.length > 0
              ? matchedSuggestions
              : DISCHARGE_SUGGESTIONS.slice(0, 6)
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => appendSuggestion(s.block, s.source)}
                className="rounded-full border border-navy-900/12 bg-navy-50 px-3 py-1 text-xs font-medium text-navy-900 hover:bg-navy-100"
                title={s.source}
              >
                + {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isInternado && !isConfirmed && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-semibold text-navy-950">Confirmar alta</h3>
          <p className="mt-1 text-xs text-navy-800/60">
            Move o paciente para Alta Recente, libera o leito (higienização) e
            registra movimentação no Kanban.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-navy-800/60">
                Acompanhamento pós-alta (dias)
              </span>
              <input
                type="number"
                min={1}
                value={altaDays}
                onChange={(e) => setAltaDays(Number(e.target.value))}
                className="w-24 rounded-md border border-navy-900/12 px-2 py-1.5"
              />
            </label>
            <button
              type="button"
              onClick={confirmDischarge}
              disabled={confirming}
              className="rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
            >
              {confirming ? "Confirmando..." : "Confirmar alta hospitalar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
