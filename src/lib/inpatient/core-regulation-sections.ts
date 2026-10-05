import { formatUnitLimitations } from "@/lib/inpatient/chart-timeline";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { formatLabDayLines } from "@/lib/inpatient/lab-summary";
import { getCriticalVitalAlerts } from "@/lib/inpatient/vital-alerts";
import { pickUltimoVital } from "@/lib/inpatient/vital-devices";
import type { EvolutionDraftContext } from "@/lib/inpatient/evolution-draft";
import { extractSignedClinicalNarratives } from "@/lib/inpatient/evolution-clinical-extract";
import type {
  EpisodeConduct,
  EpisodeEvolution,
  EpisodeImagingReport,
  EpisodeLabValue,
  EpisodePrescription,
  EpisodeProblem,
  EpisodeTreatmentResponse,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";

export function buildTransferJustificationParagraph(
  conduct: EpisodeConduct,
): string {
  const resource = conduct.resource_needed.trim() || "[especialidade/recurso necessário]";
  const limits = formatUnitLimitations(
    conduct.unit_limitations,
    conduct.unit_limitation_other,
  );
  const limitsPhrase =
    limits === "Nenhuma marcada"
      ? "[marcar limitações da unidade na aba Conduta]"
      : limits.toLowerCase();

  return (
    `Paciente necessita avaliação/tratamento em serviço de maior complexidade devido a ${resource}. ` +
    `A unidade de origem não dispõe de ${limitsPhrase}, impossibilitando a continuidade adequada da propedêutica e manejo nesta instituição.`
  );
}

export function formatTransferClassificationBlock(
  conduct: EpisodeConduct,
): string {
  const labels: Record<string, string> = {
    sem: "Sem classificação adicional",
    prioritaria: "Prioritária",
    urgente: "Urgente",
    emergencial: "Emergencial",
  };
  const label = labels[conduct.transfer_class] ?? conduct.transfer_class;
  let block = `Classificação médica da necessidade de transferência: ${label}`;
  if (
    conduct.transfer_class !== "sem" &&
    conduct.transfer_class_justification.trim()
  ) {
    block += `\nJustificativa: ${conduct.transfer_class_justification.trim()}`;
  }
  return block;
}

export function formatImpressionFromProblems(problems: EpisodeProblem[]): string {
  const active = problems.filter((p) => p.active);
  if (active.length === 0) return "Nenhum problema ativo na lista.";
  return active.map((p) => `• ${p.text}`).join("\n");
}

export function formatImagingForRegulation(
  reports: EpisodeImagingReport[],
): string {
  if (!reports.length) return "Nenhum laudo de imagem registrado.";
  return reports
    .map(
      (img) =>
        `${new Date(img.reported_at).toLocaleDateString("pt-BR")} — ${img.body_text.trim().slice(0, 400)}${img.body_text.length > 400 ? "…" : ""}`,
    )
    .join("\n");
}

export function formatLabTrendLines(values: EpisodeLabValue[]): string {
  const alerts = computeLabAlerts(values);
  const trend = alerts.filter((a) => a.kind === "trend");
  if (trend.length === 0) return "Sem tendências laboratoriais destacadas.";
  return trend.map((a) => `• ${a.message}`).join("\n");
}

export function filterLabsSince(
  values: EpisodeLabValue[],
  sinceIso: string | null | undefined,
): EpisodeLabValue[] {
  if (!sinceIso) return values;
  const t = new Date(sinceIso).getTime();
  return values.filter((v) => new Date(v.collected_at).getTime() >= t);
}

export function regulationSeverityWarning(input: {
  conduct: EpisodeConduct;
  vitalRecords: EpisodeVitalRecord[];
  labValues: EpisodeLabValue[];
}): string | null {
  if (
    input.conduct.transfer_class_confirmed &&
    input.conduct.transfer_class !== "sem"
  ) {
    return null;
  }
  const ultimo = pickUltimoVital(input.vitalRecords);
  const vitalCritical = getCriticalVitalAlerts(ultimo).length > 0;
  const labCritical = computeLabAlerts(input.labValues).some(
    (a) => a.kind === "range",
  );
  if (!vitalCritical && !labCritical) return null;
  return (
    "⚠️ Há achados de gravidade nos registros deste paciente. " +
    "Revise e preencha a Classificação médica da necessidade de transferência na aba Conduta (o sistema não classifica sozinho)."
  );
}

export function formatTreatmentResponsesSinceLastCore(input: {
  problems: EpisodeProblem[];
  responses: EpisodeTreatmentResponse[];
  prescriptions: EpisodePrescription[];
  sinceIso: string | null | undefined;
}): string {
  const since = input.sinceIso
    ? new Date(input.sinceIso).getTime()
    : null;
  const responses =
    since != null
      ? input.responses.filter(
          (r) => new Date(r.created_at).getTime() >= since,
        )
      : input.responses;
  if (!responses.length) {
    return since != null
      ? "Nenhuma resposta ao tratamento registrada desde a última atualização CORE."
      : "Nenhuma resposta ao tratamento registrada.";
  }
  const problemIds = new Set(responses.map((r) => r.problem_id));
  const subset = input.problems.filter((p) => problemIds.has(p.id));
  const statusLabel: Record<string, string> = {
    melhora: "Melhora",
    sem_mudanca: "Sem mudança",
    piora: "Piora",
  };
  return responses
    .map((r) => {
      const pr = subset.find((p) => p.id === r.problem_id);
      const label = pr?.text ?? "Problema";
      const note = r.notes.trim() ? ` — ${r.notes.trim()}` : "";
      const linked = r.linked_prescription_ids ?? [];
      const medLines = linked
        .map((id) => input.prescriptions.find((rx) => rx.id === id))
        .filter(Boolean)
        .map((rx) => `${rx!.name} ${rx!.dose}`);
      const meds =
        medLines.length > 0 ? ` Medidas: ${medLines.join("; ")}.` : "";
      return `• ${label}: ${statusLabel[r.response_status] ?? r.response_status}${note}${meds}`;
    })
    .join("\n");
}

export function buildObjectiveWorseningParagraph(
  snapshotDiffLines: string[],
  problems: EpisodeProblem[],
  responses: EpisodeTreatmentResponse[],
): string {
  const piora = responses.filter((r) => r.response_status === "piora");
  const worseningVitals = snapshotDiffLines.filter((l) =>
    /pior|elevação|queda.*pior/i.test(l),
  );
  if (piora.length === 0 && worseningVitals.length === 0) {
    return "Sem registro objetivo de piora clínica desde a última referência CORE.";
  }
  const lines: string[] = [];
  if (worseningVitals.length > 0) {
    lines.push(`Alterações objetivas: ${worseningVitals.join("; ")}.`);
  }
  if (piora.length > 0) {
    const byId = new Map(problems.map((p) => [p.id, p.text]));
    const list = piora
      .map((r) => byId.get(r.problem_id) ?? "Problema")
      .join(", ");
    lines.push(`Resposta ao tratamento com piora em: ${list}.`);
  }
  return lines.join(" ");
}

export function buildRegulationDocumentSections(input: {
  ctx: EvolutionDraftContext;
  conduct: EpisodeConduct;
  problems: EpisodeProblem[];
  evolutions: EpisodeEvolution[];
  imagingReports: EpisodeImagingReport[];
  labsSince?: EpisodeLabValue[];
}): Record<string, string> {
  const labs = input.labsSince ?? input.ctx.labValues ?? [];
  const narratives = extractSignedClinicalNarratives(input.evolutions);

  return {
    linha_do_tempo: "Ver bloco Linha do tempo clínica acima.",
    evolucao_registrada:
      narratives.length > 0
        ? narratives.join("\n\n")
        : "Nenhum texto livre de evolução clínica em evoluções assinadas.",
    exames_laboratoriais:
      labs.length > 0
        ? formatLabDayLines(labs).join("\n")
        : "Nenhum exame laboratorial registrado.",
    tendencia_laboratorial: formatLabTrendLines(input.ctx.labValues ?? []),
    exames_imagem: formatImagingForRegulation(input.imagingReports),
    impressao: formatImpressionFromProblems(input.problems),
    justificativa_transferencia: buildTransferJustificationParagraph(
      input.conduct,
    ),
    classificacao_transferencia: formatTransferClassificationBlock(input.conduct),
    aviso_gravidade:
      regulationSeverityWarning({
        conduct: input.conduct,
        vitalRecords: input.ctx.vitalRecords,
        labValues: input.ctx.labValues ?? [],
      }) ?? "",
  };
}
