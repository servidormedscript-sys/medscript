"use client";

import { useEffect, useState } from "react";
import {
  getCurrentStatusLabel,
  getStatusTimeLabels,
} from "@/lib/patient-status-time";
import type { PatientEpisode } from "@/lib/types/patient";

type StatusTimeEpisode = Pick<
  PatientEpisode,
  | "status"
  | "status_started_at"
  | "triagem_seconds"
  | "observacao_seconds"
  | "internado_seconds"
  | "alta_started_at"
>;

type StatusTimeDisplayProps = {
  episode: StatusTimeEpisode;
  compact?: boolean;
  showAccumulated?: boolean;
};

export default function StatusTimeDisplay({
  episode,
  compact = false,
  showAccumulated = true,
}: StatusTimeDisplayProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalMs = episode.status === "alta_recente" ? 60000 : 60000;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [episode.status]);

  const labels = getStatusTimeLabels(
    {
      ...episode,
      triagem_seconds: episode.triagem_seconds ?? 0,
      observacao_seconds: episode.observacao_seconds ?? 0,
      internado_seconds: episode.internado_seconds ?? 0,
      status_started_at:
        episode.status_started_at ?? new Date(now).toISOString(),
    },
    now
  );

  const currentLabel =
    episode.status === "alta_recente"
      ? labels.alta ?? labels.current
      : episode.status === "arquivado"
        ? null
        : labels.current;

  const accumulated = [
    labels.triagem !== "0 min" ? `Triagem: ${labels.triagem}` : null,
    labels.observacao !== "0 min" ? `Observação: ${labels.observacao}` : null,
    labels.internado !== "0 min" ? `Internado: ${labels.internado}` : null,
  ].filter(Boolean);

  if (compact) {
    return (
      <div className="mb-2 rounded border border-navy-900/8 bg-white px-2 py-1.5">
        {currentLabel && (
          <p className="text-[11px] font-medium text-navy-950">
            {getCurrentStatusLabel(episode.status)}: {currentLabel}
          </p>
        )}
        {showAccumulated && accumulated.length > 0 && (
          <p className={`${currentLabel ? "mt-0.5" : ""} text-[10px] text-navy-800/55`}>
            {accumulated.join(" · ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-navy-900/8 bg-navy-50/40 p-3">
      {currentLabel && (
        <p className="text-sm font-medium text-navy-950">
          {getCurrentStatusLabel(episode.status)}: {currentLabel}
        </p>
      )}
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-navy-800/50">
            Triagem (total)
          </dt>
          <dd className="text-sm text-navy-900">{labels.triagem}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-navy-800/50">
            Observação (total)
          </dt>
          <dd className="text-sm text-navy-900">{labels.observacao}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-navy-800/50">
            Internado (total)
          </dt>
          <dd className="text-sm text-navy-900">{labels.internado}</dd>
        </div>
        {labels.alta && (
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-navy-800/50">
              Alta recente
            </dt>
            <dd className="text-sm text-navy-900">{labels.alta}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
