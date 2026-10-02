import { computeClinicalStatus, type ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import type { EpisodeLabValue, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

export type EpisodeClinicalBundle = {
  vitals: EpisodeVitalRecord[];
  labs: EpisodeLabValue[];
  evolutionAt: string[];
};

export function groupByEpisode<T extends { episode_id: string }>(
  rows: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.episode_id) ?? [];
    list.push(row);
    map.set(row.episode_id, list);
  }
  return map;
}

export function computeStatusForEpisode(
  episodeId: string,
  admissionAt: string,
  birthDate: string | null,
  bundles: Map<string, EpisodeClinicalBundle>,
): ClinicalStatusResult {
  const bundle = bundles.get(episodeId) ?? {
    vitals: [],
    labs: [],
    evolutionAt: [],
  };
  return computeClinicalStatus({
    vitalRecords: bundle.vitals,
    labValues: bundle.labs,
    evolutionTimestamps: bundle.evolutionAt,
    admissionAt,
    birthDate,
  });
}
