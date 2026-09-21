import {
  COMPLEMENTARY_SECTIONS,
  EXAM_SECTIONS,
} from "@/lib/clinical/t0-form-config";
import {
  compareEvolution,
  scorePatientGrave,
  type BaselineSnapshot,
} from "@/lib/clinical/patient-grave-scoring";
import type { ClinicalSuggestion, VitalSigns } from "@/lib/types/clinical-assessment";
import { TEC_LABELS } from "@/lib/types/clinical-assessment";

export type GraveScoringResult = ReturnType<typeof scorePatientGrave>;

export function detectFever(temperature: string): boolean {
  const n = parseFloat(temperature.replace(",", "."));
  return Number.isFinite(n) && n >= 38;
}

export function generateSuggestions(
  vital: VitalSigns,
  findings: Record<string, boolean>,
  _complementary?: Record<string, boolean>
): ClinicalSuggestion[] {
  const { suggestions } = scorePatientGrave({ vital, findings });
  return suggestions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.reasons.join(" · "),
    priority:
      s.badge === "prioridade_alta" ? "alta" : s.badge === "considerar" ? "media" : "baixa",
    score: s.score,
    reasons: s.reasons,
    badge: s.badge,
    protocolId: s.protocolId,
    categoryId: s.categoryId,
  }));
}

export function generateGraveScoring(
  vital: VitalSigns,
  findings: Record<string, boolean>
): GraveScoringResult {
  return scorePatientGrave({ vital, findings });
}

export { compareEvolution, type BaselineSnapshot };

export function buildAssessmentSummary(
  vital: VitalSigns,
  findings: Record<string, boolean>,
  complementary: Record<string, boolean>,
  suggestions: ClinicalSuggestion[],
  patientName: string
): string {
  const hasFever = detectFever(vital.temperature);
  const lines: string[] = [
    `LAUDO DE AVALIAÇÃO INICIAL (T0) — ${patientName}`,
    `Data: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "SINAIS VITAIS:",
  ];

  if (vital.temperature) {
    lines.push(`- Temperatura: ${vital.temperature}°C${hasFever ? " (FEBRE)" : ""}`);
  }
  if (vital.heart_rate) lines.push(`- FC: ${vital.heart_rate} bpm`);
  if (vital.respiratory_rate) lines.push(`- FR: ${vital.respiratory_rate} irpm`);
  if (vital.systolic_bp) lines.push(`- PAS: ${vital.systolic_bp} mmHg`);
  if (vital.spo2) lines.push(`- SpO₂: ${vital.spo2}%`);
  if (vital.weight) lines.push(`- Peso: ${vital.weight} kg`);
  if (vital.tec) {
    const tecLabel =
      vital.tec in TEC_LABELS ? TEC_LABELS[vital.tec as keyof typeof TEC_LABELS] : vital.tec;
    lines.push(`- TEC: ${tecLabel}`);
  }
  if (vital.blood_glucose) lines.push(`- Glicemia: ${vital.blood_glucose} mg/dL`);

  const labelMap = [...EXAM_SECTIONS, ...COMPLEMENTARY_SECTIONS].reduce<Record<string, string>>(
    (acc, section) => {
      section.items.forEach((item) => {
        acc[item.id] = item.label;
      });
      return acc;
    },
    {}
  );

  const activeFindings = Object.entries(findings).filter(([, v]) => v);
  if (activeFindings.length > 0) {
    lines.push("", "ACHADOS DO EXAME RÁPIDO:");
    activeFindings.forEach(([id]) => lines.push(`- ${labelMap[id] ?? id}`));
  }

  const activeComp = Object.entries(complementary).filter(([, v]) => v);
  if (activeComp.length > 0) {
    lines.push("", "ISDA / ROS:");
    activeComp.forEach(([id]) => lines.push(`- ${labelMap[id] ?? id}`));
  }

  if (suggestions.length > 0) {
    lines.push("", "SUGESTÕES DE PROTOCOLO (triagem):");
    suggestions.forEach((s) => {
      const pts = s.score != null ? ` [${s.score} pts]` : "";
      lines.push(`- ${s.title}${pts}: ${s.description}`);
    });
  }

  return lines.join("\n");
}

export function buildInternacaoNoteFromGrave(input: {
  findings: Record<string, boolean>;
  complementary: Record<string, boolean>;
  vital: VitalSigns;
  topSuggestion: ClinicalSuggestion | null;
  pcr: boolean;
}): string {
  const labelMap = [...EXAM_SECTIONS, ...COMPLEMENTARY_SECTIONS].reduce<Record<string, string>>(
    (acc, section) => {
      section.items.forEach((item) => {
        acc[item.id] = item.label;
      });
      return acc;
    },
    {}
  );
  const parts = ["Internação iniciada a partir da triagem em Meu Paciente Grave."];
  if (input.pcr) {
    parts.push("Contexto: PCR — parada cardiorrespiratória.");
  } else if (input.topSuggestion) {
    parts.push(`Suspeita principal: ${input.topSuggestion.title} (triagem MPG).`);
  }
  const alerts = Object.entries(input.findings)
    .filter(([, v]) => v)
    .map(([id]) => labelMap[id] ?? id);
  if (alerts.length) parts.push(`Achados de alerta: ${alerts.join("; ")}.`);
  const ros = Object.entries(input.complementary)
    .filter(([, v]) => v)
    .map(([id]) => labelMap[id] ?? id);
  if (ros.length) parts.push(`ISDA positivo: ${ros.join("; ")}.`);
  if (input.vital.blood_glucose) parts.push(`Glicemia na triagem: ${input.vital.blood_glucose} mg/dL.`);
  return parts.join("\n");
}
