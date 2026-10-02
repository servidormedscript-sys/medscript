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
