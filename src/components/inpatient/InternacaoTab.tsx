"use client";

import { useCallback, useState } from "react";
import { countPendingReconciliation } from "@/lib/inpatient/discharge-draft";
import { buildInternacaoDraft } from "@/lib/inpatient/internacao-draft";
import type {
  EpisodeConduct,
  EpisodeEvolution,
  EpisodeImagingReport,
  EpisodeInternacao,
  EpisodeLabValue,
  EpisodeMedReconciliation,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";

type Props = {
  episodeId: string;
  episode: PatientEpisode;
  patient: Patient;
  internacao: EpisodeInternacao;
  pendingReconciliation: number;
  altaConfirmed: boolean;
  vitals: EpisodeVitalRecord[];
  exams: EpisodePhysicalExam[];
  evolutions: EpisodeEvolution[];
  prescriptions: EpisodePrescription[];
  reconciliation: EpisodeMedReconciliation[];
  labValues: EpisodeLabValue[];
  imaging: EpisodeImagingReport[];
  conduct: EpisodeConduct | null;
  onInternacaoChange: (d: EpisodeInternacao) => void;
  onNavigateAlta: () => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-navy-950 outline-none focus:border-navy-700";

export default function InternacaoTab({
  episodeId,
  episode,
  patient,
  internacao,
  pendingReconciliation,
  altaConfirmed,
  vitals,
  exams,
  evolutions,
  prescriptions,
  reconciliation,
  labValues,
  imaging,
  conduct,
  onInternacaoChange,
  onNavigateAlta,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInternado = episode.status === "internado";
  const isFinalized = Boolean(internacao.finalized_at);
  const readOnly = !isInternado || altaConfirmed || isFinalized;

  const saveDraft = useCallback(
    async (patch: Partial<EpisodeInternacao>) => {
      if (readOnly) return;
      setSaving(true);
      setError(null);
      const next = { ...internacao, ...patch };
      const res = await fetch(
        `/api/pacientes/episodios/${episodeId}/internacao`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary_text: next.summary_text,
            orientations_text: next.orientations_text,
          }),
        },
      );
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      onInternacaoChange(data.internacao);
    },
    [episodeId, internacao, onInternacaoChange, readOnly],
  );

  async function finalizeDocument() {
    if (readOnly || !internacao.summary_text.trim()) return;
    if (
      !window.confirm(
        "Finalizar o documento de internação/AIH? Após isso o texto não poderá ser editado no prontuário.",
      )
    ) {
      return;
    }
    setFinalizing(true);
    setError(null);
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/internacao/finalizar`,
      { method: "POST" },
    );
    const data = await res.json();
    setFinalizing(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao finalizar documento.");
      return;
    }
    onInternacaoChange(data.internacao);
  }

  function generateDraft() {
    const draft = buildInternacaoDraft({
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
      homeMedicationsText: episode.medications,
    });
    let orientations = draft.orientations;
    const pending = countPendingReconciliation(reconciliation);
    if (pending > 0) {
      orientations = `⚠ Reconciliação medicamentosa incompleta — ${pending} medicação(ões) de casa sem decisão.\n\n${orientations}`;
    }
    onInternacaoChange({
      ...internacao,
      summary_text: draft.summary,
      orientations_text: orientations,
    });
    saveDraft({
      summary_text: draft.summary,
      orientations_text: orientations,
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      <p className="text-sm text-navy-800/70">
        Documento de <strong>internação / AIH</strong> montado só com dados já
        registrados no prontuário (sem texto inventado). Para alta hospitalar,
        confirmação de leito e sugestões por diagnóstico, use a aba{" "}
        <button
          type="button"
          onClick={onNavigateAlta}
          className="font-medium text-navy-900 underline hover:no-underline"
        >
          Alta
        </button>
        .
      </p>

      {!isInternado && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Paciente não está em internação — documento disponível para consulta.
        </p>
      )}

      {isFinalized && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Documento finalizado
          {internacao.finalized_at
            ? ` em ${new Date(internacao.finalized_at).toLocaleString("pt-BR")}`
            : ""}
          — somente leitura.
        </p>
      )}

      {altaConfirmed && (
        <p className="rounded-md border border-navy-900/10 bg-navy-50 px-3 py-2 text-sm text-navy-900">
          Alta já confirmada — este documento não pode mais ser alterado.
        </p>
      )}

      {pendingReconciliation > 0 && isInternado && !altaConfirmed && (
        <p
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="alert"
        >
          ⚠ Reconciliação medicamentosa incompleta — {pendingReconciliation}{" "}
          medicação(ões) de casa sem decisão.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateDraft}
          disabled={readOnly || saving}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          ✨ Gerar rascunho automático
        </button>
        {saving && (
          <span className="text-xs text-navy-800/50 self-center">Salvando…</span>
        )}
        {isInternado && !altaConfirmed && !isFinalized && (
          <button
            type="button"
            onClick={finalizeDocument}
            disabled={finalizing || !internacao.summary_text.trim()}
            className="rounded-md border border-emerald-800/30 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
          >
            {finalizing ? "Finalizando…" : "Finalizar documento AIH"}
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy-950">
          Resumo (internação)
        </label>
        <textarea
          rows={14}
          readOnly={readOnly}
          value={internacao.summary_text}
          onChange={(e) =>
            onInternacaoChange({ ...internacao, summary_text: e.target.value })
          }
          onBlur={() => saveDraft({ summary_text: internacao.summary_text })}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy-950">
          Orientações / plano
        </label>
        <textarea
          rows={10}
          readOnly={readOnly}
          value={internacao.orientations_text}
          onChange={(e) =>
            onInternacaoChange({
              ...internacao,
              orientations_text: e.target.value,
            })
          }
          onBlur={() =>
            saveDraft({ orientations_text: internacao.orientations_text })
          }
          className={inputClass}
        />
      </div>
    </div>
  );
}
