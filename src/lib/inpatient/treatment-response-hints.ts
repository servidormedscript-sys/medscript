import { prescriptionsForProblem } from "@/lib/inpatient/treatment-response-meds";
import type {
  EpisodeProblem,
  EpisodePrescription,
  EpisodeTreatmentResponse,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";

export type TreatmentResponseInvite = {
  problemId: string;
  problemText: string;
  reason: "multi_meds" | "o2_trend";
  detail?: string;
};

export function detectO2FlowIncreaseSentence(
  vitalRecords: EpisodeVitalRecord[],
): string | null {
  const withFlow = vitalRecords
    .filter((v) => v.o2_flow_lmin != null && v.o2_flow_lmin > 0)
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
  if (withFlow.length < 2) return null;
  const prev = withFlow[withFlow.length - 2];
  const last = withFlow[withFlow.length - 1];
  if (last.o2_flow_lmin! <= prev.o2_flow_lmin!) return null;
  return (
    `Necessidade crescente de suporte de oxigênio, de ${prev.o2_flow_lmin} para ` +
    `${last.o2_flow_lmin} L/min.`
  );
}

export function buildTreatmentResponseInvites(input: {
  problems: EpisodeProblem[];
  prescriptions: EpisodePrescription[];
  responses: EpisodeTreatmentResponse[];
}): TreatmentResponseInvite[] {
  const invites: TreatmentResponseInvite[] = [];
  const responded = new Set(input.responses.map((r) => r.problem_id));

  for (const pr of input.problems.filter((p) => p.active)) {
    if (responded.has(pr.id)) continue;
    const meds = prescriptionsForProblem(pr, input.prescriptions);
    if (meds.length >= 2) {
      invites.push({
        problemId: pr.id,
        problemText: pr.text,
        reason: "multi_meds",
        detail: `${meds.length} medicações com indicação relacionada.`,
      });
    }
  }

  return invites;
}
