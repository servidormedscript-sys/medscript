import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import {
  paduaHighRisk,
  scorePadua,
  suggestTevProphylaxis,
  type PaduaFlags,
} from "@/lib/inpatient/general-orders";
import { formatPrescriptionLine } from "@/lib/inpatient/prescription-format";
import type {
  EpisodeLabValue,
  EpisodePrescription,
} from "@/lib/types/inpatient-chart";

export function buildConductSuggestion(input: {
  activePrescriptions: EpisodePrescription[];
  labValues: EpisodeLabValue[];
  clinicalStatus: ClinicalStatusResult;
  padua: PaduaFlags;
  ageYears: number | null;
  weightKg: number | null;
}): string {
  const lines: string[] = [];

  const active = input.activePrescriptions.filter((p) => !p.suspended_at);
  if (active.length > 0) {
    lines.push("Medicações ativas a manter:");
    for (const rx of active) {
      lines.push(`• ${formatPrescriptionLine(rx)}`);
    }
  } else {
    lines.push("Medicações ativas: nenhuma prescrita no momento.");
  }

  const alerts = computeLabAlerts(input.labValues);
  const altered = alerts;
  if (altered.length > 0) {
    lines.push("");
    lines.push("Exames alterados a controlar:");
    for (const a of altered.slice(0, 8)) {
      lines.push(`• ${a.message}`);
    }
  }

  lines.push("");
  lines.push(
    `Classificação de risco: ${input.clinicalStatus.risk.toUpperCase()} — ${input.clinicalStatus.riskReasons.join("; ") || "sem motivos adicionais"}.`,
  );
  lines.push(
    `Critérios de alta: ${input.clinicalStatus.discharge.met}/${input.clinicalStatus.discharge.total}.`,
  );

  if (input.clinicalStatus.evolutionDelayAlert === "high") {
    lines.push("⚠ Evolução atrasada ≥24h — priorizar registro e reavaliação.");
  } else if (input.clinicalStatus.evolutionDelayAlert === "medium") {
    lines.push("⚠ Evolução atrasada ≥12h — considerar evolução hoje.");
  }

  const paduaTotal = scorePadua(input.padua);
  lines.push("");
  lines.push(`Escore Padua: ${paduaTotal} (${paduaHighRisk(input.padua) ? "alto risco TEV" : "baixo risco TEV"}).`);
  const tev = suggestTevProphylaxis({
    padua: input.padua,
    ageYears: input.ageYears,
    weightKg: input.weightKg,
  });
  if (tev) lines.push(tev);

  lines.push("");
  lines.push(
    "Orientar paciente/acompanhante sobre o quadro atual e o plano terapêutico.",
  );

  return lines.join("\n");
}
