import {
  INPATIENT_SPECIALTY_OPTIONS,
  resolveEpisodeSpecialty,
  specialtyLabel,
  type InpatientSpecialtyKey,
} from "@/lib/inpatient/specialty";
import type { RiskLevel } from "@/lib/types/patient";

export type SpecialtyChartRow = {
  key: InpatientSpecialtyKey;
  label: string;
  count: number;
  inferred_count: number;
  by_risk: Record<RiskLevel, number>;
};

export function buildSpecialtyChart(
  episodes: {
    status: string;
    care_specialty?: string | null;
    diagnosis?: string | null;
    clinical_risk?: RiskLevel | null;
  }[],
): SpecialtyChartRow[] {
  const counts = new Map<
    InpatientSpecialtyKey,
    { count: number; inferred: number; by_risk: Record<RiskLevel, number> }
  >();

  for (const ep of episodes) {
    if (ep.status !== "internado") continue;
    const resolved = resolveEpisodeSpecialty({
      care_specialty: ep.care_specialty,
      diagnosis: ep.diagnosis,
    });
    const key = resolved?.key ?? "outra";
    const bucket = counts.get(key) ?? {
      count: 0,
      inferred: 0,
      by_risk: { alto: 0, medio: 0, baixo: 0 },
    };
    bucket.count += 1;
    if (resolved?.inferred) bucket.inferred += 1;
    const risk = ep.clinical_risk ?? "baixo";
    bucket.by_risk[risk] += 1;
    counts.set(key, bucket);
  }

  const rows: SpecialtyChartRow[] = INPATIENT_SPECIALTY_OPTIONS.map((opt) => {
    const bucket = counts.get(opt.key);
    return {
      key: opt.key,
      label: specialtyLabel(opt.key),
      count: bucket?.count ?? 0,
      inferred_count: bucket?.inferred ?? 0,
      by_risk: bucket?.by_risk ?? { alto: 0, medio: 0, baixo: 0 },
    };
  }).filter((r) => r.count > 0);

  rows.sort((a, b) => b.count - a.count);
  return rows;
}
