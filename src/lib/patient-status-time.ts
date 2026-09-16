import type { PatientEpisode, PatientStatus } from "@/lib/types/patient";

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY;

export type StatusTimeSnapshot = {
  triagem: number;
  observacao: number;
  internado: number;
  altaDays: number | null;
  currentStatus: PatientStatus;
  currentElapsed: number;
};

export type StatusTimeLabels = {
  triagem: string;
  observacao: string;
  internado: string;
  alta: string | null;
  current: string;
};

const STATUS_SECONDS_FIELD: Record<
  "triagem" | "em_observacao" | "internado",
  keyof Pick<PatientEpisode, "triagem_seconds" | "observacao_seconds" | "internado_seconds">
> = {
  triagem: "triagem_seconds",
  em_observacao: "observacao_seconds",
  internado: "internado_seconds",
};

export function getCurrentPeriodSeconds(
  statusStartedAt: string | null | undefined,
  now = Date.now()
): number {
  if (!statusStartedAt) return 0;
  const started = new Date(statusStartedAt).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}

export function getAltaElapsedDays(
  altaStartedAt: string | null | undefined,
  now = Date.now()
): number | null {
  if (!altaStartedAt) return null;

  const start = new Date(altaStartedAt);
  if (Number.isNaN(start.getTime())) return null;

  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 min";

  let remaining = seconds;
  const months = Math.floor(remaining / SECONDS_IN_MONTH);
  remaining %= SECONDS_IN_MONTH;
  const days = Math.floor(remaining / SECONDS_IN_DAY);
  remaining %= SECONDS_IN_DAY;
  const hours = Math.floor(remaining / SECONDS_IN_HOUR);
  remaining %= SECONDS_IN_HOUR;
  const minutes = Math.floor(remaining / SECONDS_IN_MINUTE);

  const parts: string[] = [];

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "mês" : "meses"}`);
  }
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} min`);
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

export function formatAltaDays(days: number): string {
  return `${days} ${days === 1 ? "dia" : "dias"} de alta`;
}

export function getStatusTimeSnapshot(
  episode: Pick<
    PatientEpisode,
    | "status"
    | "status_started_at"
    | "triagem_seconds"
    | "observacao_seconds"
    | "internado_seconds"
    | "alta_started_at"
  >,
  now = Date.now()
): StatusTimeSnapshot {
  const currentElapsed = getCurrentPeriodSeconds(episode.status_started_at, now);

  const triagem =
    episode.triagem_seconds +
    (episode.status === "triagem" ? currentElapsed : 0);
  const observacao =
    episode.observacao_seconds +
    (episode.status === "em_observacao" ? currentElapsed : 0);
  const internado =
    episode.internado_seconds +
    (episode.status === "internado" ? currentElapsed : 0);

  return {
    triagem,
    observacao,
    internado,
    altaDays:
      episode.status === "alta_recente"
        ? getAltaElapsedDays(episode.alta_started_at, now)
        : null,
    currentStatus: episode.status,
    currentElapsed,
  };
}

export function getStatusTimeLabels(
  episode: Pick<
    PatientEpisode,
    | "status"
    | "status_started_at"
    | "triagem_seconds"
    | "observacao_seconds"
    | "internado_seconds"
    | "alta_started_at"
  >,
  now = Date.now()
): StatusTimeLabels {
  const snapshot = getStatusTimeSnapshot(episode, now);

  return {
    triagem: formatDuration(snapshot.triagem),
    observacao: formatDuration(snapshot.observacao),
    internado: formatDuration(snapshot.internado),
    alta:
      snapshot.altaDays !== null ? formatAltaDays(snapshot.altaDays) : null,
    current:
      snapshot.currentStatus === "alta_recente" && snapshot.altaDays !== null
        ? formatAltaDays(snapshot.altaDays)
        : formatDuration(snapshot.currentElapsed),
  };
}

export function accumulateStatusSeconds(
  fromStatus: PatientStatus,
  episode: Pick<
    PatientEpisode,
    "triagem_seconds" | "observacao_seconds" | "internado_seconds" | "status_started_at"
  >,
  now = Date.now()
): Pick<
  PatientEpisode,
  "triagem_seconds" | "observacao_seconds" | "internado_seconds"
> {
  const elapsed = getCurrentPeriodSeconds(episode.status_started_at, now);
  const field = STATUS_SECONDS_FIELD[fromStatus as keyof typeof STATUS_SECONDS_FIELD];

  if (!field || elapsed <= 0) {
    return {
      triagem_seconds: episode.triagem_seconds,
      observacao_seconds: episode.observacao_seconds,
      internado_seconds: episode.internado_seconds,
    };
  }

  return {
    triagem_seconds: episode.triagem_seconds,
    observacao_seconds: episode.observacao_seconds,
    internado_seconds: episode.internado_seconds,
    [field]: episode[field] + elapsed,
  };
}

export function getCurrentStatusLabel(status: PatientStatus): string {
  switch (status) {
    case "triagem":
      return "Triagem";
    case "em_observacao":
      return "Observação";
    case "internado":
      return "Internado";
    case "alta_recente":
      return "Alta recente";
    default:
      return status;
  }
}

export function buildStatusTimesSummary(
  episode: Pick<
    PatientEpisode,
    | "status"
    | "status_started_at"
    | "triagem_seconds"
    | "observacao_seconds"
    | "internado_seconds"
    | "alta_started_at"
  >,
  now = Date.now()
): string[] {
  const labels = getStatusTimeLabels(episode, now);
  const lines = [
    `Triagem: ${labels.triagem}`,
    `Observação: ${labels.observacao}`,
    `Internado: ${labels.internado}`,
  ];

  if (labels.alta) {
    lines.push(`Alta recente: ${labels.alta}`);
  }

  if (
    episode.status !== "arquivado" &&
    episode.status !== "alta_recente"
  ) {
    lines.push(
      `Tempo no status atual (${getCurrentStatusLabel(episode.status)}): ${labels.current}`
    );
  } else if (episode.status === "alta_recente" && episode.alta_started_at) {
    lines.push(
      `Alta iniciada em ${new Date(episode.alta_started_at).toLocaleDateString("pt-BR")}`
    );
  } else if (episode.status === "arquivado" && episode.alta_started_at) {
    lines.push(
      `Alta iniciada em ${new Date(episode.alta_started_at).toLocaleDateString("pt-BR")}`
    );
  }

  return lines;
}
