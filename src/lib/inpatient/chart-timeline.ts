import { UNIT_LIMITATION_ITEMS } from "@/lib/inpatient/unit-limitations";
import type {
  EpisodeEvolution,
  EpisodePrescription,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import type { PatientEpisode } from "@/lib/types/patient";

export type TimelineEvent = {
  occurred_at: string;
  event_type: string;
  summary_text: string;
};

export function buildChartTimeline(input: {
  episode: PatientEpisode;
  evolutions: EpisodeEvolution[];
  prescriptions: EpisodePrescription[];
  vitals: EpisodeVitalRecord[];
  storedEvents?: TimelineEvent[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    occurred_at: input.episode.created_at,
    event_type: "admissao",
    summary_text: `Admissão — ${input.episode.diagnosis?.trim() || "sem diagnóstico na ficha"}`,
  });

  for (const rx of input.prescriptions) {
    events.push({
      occurred_at: rx.started_at,
      event_type: "prescricao_inicio",
      summary_text: `Início: ${rx.name} ${rx.dose}`,
    });
    if (rx.suspended_at) {
      events.push({
        occurred_at: rx.suspended_at,
        event_type: "prescricao_suspensao",
        summary_text: `Suspensão: ${rx.name}`,
      });
    }
  }

  for (const v of input.vitals) {
    if (v.o2_type && v.o2_type !== "ar_ambiente") {
      events.push({
        occurred_at: v.recorded_at,
        event_type: "dispositivo_o2",
        summary_text: `Suporte O₂: ${v.o2_type}${v.o2_flow_lmin ? ` ${v.o2_flow_lmin} L/min` : ""}`,
      });
    }
  }

  for (const ev of input.evolutions) {
    if (!ev.signed_at) continue;
    events.push({
      occurred_at: ev.signed_at,
      event_type: "evolucao",
      summary_text: "Evolução médica assinada",
    });
  }

  if (input.storedEvents) {
    events.push(...input.storedEvents);
  }

  return events.sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
}

export function formatTimelineBlock(events: TimelineEvent[], since?: string): string {
  const filtered = since
    ? events.filter(
        (e) => new Date(e.occurred_at).getTime() >= new Date(since).getTime(),
      )
    : events;
  if (filtered.length === 0) return "Nenhum evento na linha do tempo.";
  return filtered
    .slice()
    .reverse()
    .map(
      (e) =>
        `${new Date(e.occurred_at).toLocaleString("pt-BR")} — ${e.summary_text}`,
    )
    .join("\n");
}

export function formatUnitLimitations(
  flags: Record<string, boolean>,
  other: string,
): string {
  const labels: string[] = UNIT_LIMITATION_ITEMS.filter((i) => flags[i.id]).map(
    (i) => i.label,
  );
  if (other.trim()) labels.push(other.trim());
  return labels.length > 0 ? labels.join("; ") : "Nenhuma limitação marcada.";
}

export const TRANSFER_CLASS_LABELS: Record<string, string> = {
  sem: "Sem classificação adicional",
  prioritaria: "Prioritária",
  urgente: "Urgente",
  emergencial: "Emergencial",
};
