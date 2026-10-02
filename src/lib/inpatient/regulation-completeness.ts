import { hoursSinceLastEvolution } from "@/lib/inpatient/evolution-delay";
import type {
  EpisodeConduct,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeProblem,
  EpisodeTreatmentResponse,
} from "@/lib/types/inpatient-chart";
import type { PatientEpisode } from "@/lib/types/patient";

export type RegulationPendency = {
  id: string;
  label: string;
};

export function checkRegulationCompleteness(input: {
  episode: PatientEpisode;
  conduct: EpisodeConduct;
  /** Preferir timestamps de evoluções assinadas. */
  evolutionTimestamps: string[];
  physicalExams: EpisodePhysicalExam[];
  prescriptions: EpisodePrescription[];
  noSpecificTreatmentAcknowledged?: boolean;
  activeProblems?: EpisodeProblem[];
  treatmentResponses?: EpisodeTreatmentResponse[];
  noTreatmentResponseWaiver?: boolean;
}): RegulationPendency[] {
  const missing: RegulationPendency[] = [];

  if (!input.episode.diagnosis?.trim()) {
    missing.push({ id: "dx", label: "Diagnóstico principal preenchido" });
  }

  const evoHours = hoursSinceLastEvolution(
    input.evolutionTimestamps,
    input.episode.created_at,
  );
  if (evoHours >= 24) {
    missing.push({
      id: "evo",
      label: "Evolução registrada nas últimas 24h",
    });
  }

  const hasRx = input.prescriptions.some((p) => !p.suspended_at);
  const hasConduct = input.conduct.conduct_text.trim().length > 0;
  if (
    !hasRx &&
    !hasConduct &&
    !input.noSpecificTreatmentAcknowledged
  ) {
    missing.push({
      id: "rx",
      label:
        "Tratamento instituído registrado (prescrição ou conduta) ou marcar ausência explícita",
    });
  }

  if (input.physicalExams.length === 0) {
    missing.push({
      id: "exam",
      label: "Exame físico atual registrado",
    });
  }

  if (!input.conduct.resource_needed.trim()) {
    missing.push({
      id: "resource",
      label: 'Campo "Especialidade/recurso necessário" preenchido',
    });
  }

  if (!input.conduct.transfer_class_confirmed) {
    missing.push({
      id: "transfer",
      label:
        "Classificação médica da transferência confirmada na aba Conduta",
    });
  }

  const activeProblems =
    input.activeProblems?.filter((p) => p.active) ?? [];
  if (activeProblems.length > 0 && !input.noTreatmentResponseWaiver) {
    const responded = new Set(
      (input.treatmentResponses ?? []).map((r) => r.problem_id),
    );
    const missingProblems = activeProblems.filter((p) => !responded.has(p.id));
    if (missingProblems.length > 0) {
      missing.push({
        id: "treatment_response",
        label:
          "Resposta ao tratamento registrada para cada problema ativo (ou marcar dispensa na aba Evolução/Conduta)",
      });
    }
  }

  return missing;
}
