"use client";

import { useEffect, useState } from "react";
import type { KanbanEpisode, PatientStatus, RiskLevel } from "@/lib/types/patient";
import {
  ALLOWED_TRANSITIONS,
  RISK_LABELS,
  STATUS_LABELS,
} from "@/lib/types/patient";

type MovePatientModalProps = {
  episode: KanbanEpisode;
  defaultToStatus?: PatientStatus;
  onClose: () => void;
  onMoved: () => void;
  onError: (text: string) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function MovePatientModal({
  episode,
  defaultToStatus,
  onClose,
  onMoved,
  onError,
}: MovePatientModalProps) {
  const allowed = ALLOWED_TRANSITIONS[episode.status];
  const initialStatus =
    defaultToStatus && allowed.includes(defaultToStatus)
      ? defaultToStatus
      : allowed[0];

  const [loading, setLoading] = useState(false);
  const [toStatus, setToStatus] = useState<PatientStatus>(initialStatus);
  const [report, setReport] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medio");
  const [altaDays, setAltaDays] = useState(7);

  useEffect(() => {
    setToStatus(initialStatus);
    setReport("");
    setRiskLevel("medio");
    setAltaDays(7);
  }, [episode.id, initialStatus]);

  const reportLabel: Record<PatientStatus, string> = {
    triagem: "Relatório de retorno à triagem",
    em_observacao: "Relatório de observação",
    internado: "Relatório de internação",
    alta_recente: "Relatório de alta",
    arquivado: "Relatório",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/pacientes/episodios/${episode.id}/mover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_status: toStatus,
        report_text: report,
        risk_level: toStatus === "internado" ? riskLevel : undefined,
        alta_days: toStatus === "alta_recente" ? altaDays : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      onError(data.error ?? "Erro ao movimentar paciente.");
      return;
    }

    onMoved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-navy-900/10 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-navy-950">Movimentar paciente</h2>
            <p className="text-sm text-navy-800/60">
              {episode.patient?.full_name} · {STATUS_LABELS[episode.status]}
              {defaultToStatus && defaultToStatus !== episode.status && (
                <> → {STATUS_LABELS[defaultToStatus]}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-navy-800/50 hover:text-navy-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Destino
            </label>
            <select
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value as PatientStatus)}
              className={inputClass}
            >
              {allowed.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              {reportLabel[toStatus]} *
            </label>
            <textarea
              required={toStatus !== "triagem"}
              rows={4}
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Descreva o relatório desta movimentação..."
              className={inputClass}
            />
          </div>

          {toStatus === "internado" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Classificação de risco *
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className={inputClass}
              >
                {(Object.keys(RISK_LABELS) as RiskLevel[]).map((risk) => (
                  <option key={risk} value={risk}>
                    {RISK_LABELS[risk]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {toStatus === "alta_recente" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Período de acompanhamento (dias) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={altaDays}
                onChange={(e) => setAltaDays(Number(e.target.value))}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-navy-800/50">
                Se o paciente não retornar à triagem neste prazo, será arquivado
                automaticamente.
              </p>
            </div>
          )}

          {toStatus === "triagem" && episode.status === "alta_recente" && (
            <p className="rounded-md border border-navy-900/8 bg-navy-50 px-3 py-2 text-xs text-navy-800/65">
              O paciente retornará à triagem e o prazo de alta será cancelado.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-navy-900/12 py-2.5 text-sm font-medium text-navy-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Confirmar movimentação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
