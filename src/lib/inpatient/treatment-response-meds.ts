import type {
  EpisodePrescription,
  EpisodeProblem,
} from "@/lib/types/inpatient-chart";

/** Prescrições ativas cuja indicação referencia o problema (5.6). */
export function prescriptionsForProblem(
  problem: EpisodeProblem,
  prescriptions: EpisodePrescription[],
): EpisodePrescription[] {
  const active = prescriptions.filter((p) => !p.suspended_at);
  const needle = problem.text.trim().toLowerCase();
  if (!needle) return [];

  return active.filter((p) => {
    const ind = (p.indication ?? "").trim().toLowerCase();
    if (!ind) return false;
    if (ind === needle) return true;
    if (ind.includes(needle) || needle.includes(ind)) return true;
    const first = needle.split(/\s+/)[0];
    return first.length >= 4 && ind.includes(first);
  });
}

export function defaultLinkedPrescriptionIds(
  problem: EpisodeProblem,
  prescriptions: EpisodePrescription[],
): string[] {
  return prescriptionsForProblem(problem, prescriptions).map((p) => p.id);
}
