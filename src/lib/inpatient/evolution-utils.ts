import type { EpisodeEvolution } from "@/lib/types/inpatient-chart";

export function isEvolutionSigned(ev: EpisodeEvolution): boolean {
  return ev.signed_at != null;
}

export function pickLatestSignedEvolution(
  evolutions: EpisodeEvolution[],
): EpisodeEvolution | undefined {
  return evolutions
    .filter((e) => e.signed_at)
    .sort(
      (a, b) =>
        new Date(b.signed_at!).getTime() - new Date(a.signed_at!).getTime(),
    )[0];
}

export function signedEvolutionTimestamps(
  evolutions: EpisodeEvolution[],
): string[] {
  return evolutions
    .filter((e) => e.signed_at)
    .map((e) => e.signed_at as string);
}

export function evolutionChronologicalOrder(
  evolutions: EpisodeEvolution[],
): EpisodeEvolution[] {
  return [...evolutions].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function evolutionDisplayNumber(
  evolutions: EpisodeEvolution[],
  ev: EpisodeEvolution,
): string {
  const sorted = evolutionChronologicalOrder(evolutions);
  const idx = sorted.findIndex((e) => e.id === ev.id);
  return String(Math.max(0, idx) + 1).padStart(3, "0");
}

export function mapEvolutionRow(row: Record<string, unknown>): EpisodeEvolution {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    content_html: String(row.content_html ?? ""),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    signed_at: row.signed_at != null ? String(row.signed_at) : null,
    signed_by: row.signed_by != null ? String(row.signed_by) : null,
    addendum_of_id:
      row.addendum_of_id != null ? String(row.addendum_of_id) : null,
    addendum_reason:
      row.addendum_reason != null && String(row.addendum_reason).trim()
        ? String(row.addendum_reason).trim()
        : null,
  };
}
