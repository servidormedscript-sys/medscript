import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import {
  codeStatusLabel,
  isRestrictedCodeStatus,
  type CodeStatus,
} from "@/lib/inpatient/code-status";
import type { EpisodeHandoffTask } from "@/lib/types/inpatient-chart";

export function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildPatientHandoffBlock(input: {
  patientName: string;
  bed: string | null;
  codeStatus: CodeStatus;
  clinicalStatus: ClinicalStatusResult;
  diagnosis: string | null;
  admissionAt: string;
  lastEvolutionPlain: string | null;
  tasks: EpisodeHandoffTask[];
  contingencyPlan: string;
}): string {
  const day = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(input.admissionAt).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );
  const codeExtra = isRestrictedCodeStatus(input.codeStatus)
    ? ` ⚠️ ${codeStatusLabel(input.codeStatus)}`
    : "";

  const bedPart = input.bed ? `Leito ${input.bed}` : "Leito —";
  const lines: string[] = [
    `• ${input.patientName} (${bedPart})${codeExtra}`,
    `   [I] Gravidade: ${input.clinicalStatus.risk} — ${input.clinicalStatus.riskReasons.join("; ") || "sem alertas adicionais"}`,
    `   [P] ${input.diagnosis?.trim() || "Diagnóstico não informado"} — Dia ${day} de internação — Critérios de alta: ${input.clinicalStatus.discharge.met}/${input.clinicalStatus.discharge.total} — Última evolução: ${truncate(input.lastEvolutionPlain || "não registrada", 280)}`,
  ];

  const pending = input.tasks.filter((t) => !t.completed);
  const pendingText =
    pending.length > 0
      ? pending.map((t) => t.text).join("; ")
      : "nenhuma pendência registrada";
  lines.push(`   [A] Pendências: ${pendingText}`);

  const contingency =
    input.contingencyPlan.trim() || "não registrado";
  lines.push(`   [S] Se piorar: ${contingency}`);

  return lines.join("\n");
}

function truncate(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export function buildUnitHandoffDocument(
  unitLabel: string,
  blocks: string[],
): string {
  const header = `=== ${unitLabel} (${blocks.length}) ===`;
  return [header, ...blocks].join("\n");
}
