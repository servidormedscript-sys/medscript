import type { PatientEpisode } from "@/lib/types/patient";

export function computeInternationDay(episode: PatientEpisode): number {
  const start = new Date(episode.created_at);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}
