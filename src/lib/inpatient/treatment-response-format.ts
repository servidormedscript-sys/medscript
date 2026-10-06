import type {
  EpisodePrescription,
  EpisodeProblem,
  EpisodeTreatmentResponse,
  TreatmentResponseStatus,
} from "@/lib/types/inpatient-chart";

export const TREATMENT_RESPONSE_LABELS: Record<TreatmentResponseStatus, string> =
  {
    melhora: "Melhorou",
    melhora_parcial: "Melhora parcial",
    sem_mudanca: "Sem mudança",
    sem_resposta: "Sem resposta",
    piora: "Piora",
  };

function medSummary(
  prescriptions: EpisodePrescription[],
  linkedIds: string[],
): string {
  const lines = linkedIds
    .map((id) => prescriptions.find((rx) => rx.id === id))
    .filter(Boolean)
    .map((rx) => `${rx!.name} ${rx!.dose} ${rx!.route}`);
  return lines.length > 0 ? lines.join(", ") : "medidas terapêuticas instituídas";
}

/** Frases fixas do PDF 5.6 após confirmação do médico. */
export function formatTreatmentResponseSentence(input: {
  problem: EpisodeProblem;
  response: EpisodeTreatmentResponse;
  prescriptions: EpisodePrescription[];
}): string {
  const problem = input.problem.text.trim();
  const meds = medSummary(
    input.prescriptions,
    input.response.linked_prescription_ids ?? [],
  );
  const note = input.response.notes.trim();
  const suffix = note ? `. ${note}` : "";

  switch (input.response.response_status) {
    case "sem_resposta":
    case "sem_mudanca":
      return (
        `Mantém ${problem} apesar das medidas terapêuticas instituídas, incluindo ${meds}, ` +
        `sem controle satisfatório até o momento${suffix}.`
      );
    case "piora":
      return `Apresenta piora de ${problem} apesar de ${meds}${suffix}.`;
    case "melhora_parcial":
      return `Apresenta melhora parcial de ${problem} com ${meds}${suffix}.`;
    case "melhora":
      return `Apresenta melhora de ${problem} com ${meds}${suffix}.`;
    default:
      return `${problem}: ${TREATMENT_RESPONSE_LABELS[input.response.response_status]}${suffix}`;
  }
}

export function formatAllTreatmentResponseParagraphs(input: {
  problems: EpisodeProblem[];
  responses: EpisodeTreatmentResponse[];
  prescriptions: EpisodePrescription[];
}): string {
  const byProblem = new Map(input.problems.map((p) => [p.id, p]));
  const lines: string[] = [];
  for (const r of input.responses) {
    const pr = byProblem.get(r.problem_id);
    if (!pr) continue;
    lines.push(formatTreatmentResponseSentence({ problem: pr, response: r, prescriptions: input.prescriptions }));
  }
  return lines.length > 0
    ? lines.join("\n\n")
    : "Nenhuma resposta ao tratamento confirmada.";
}
