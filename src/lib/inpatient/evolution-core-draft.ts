import { buildDischargeDraft } from "@/lib/inpatient/discharge-draft";
import {
  buildEvolutionDraftHtml,
  type EvolutionDraftContext,
} from "@/lib/inpatient/evolution-draft";
import type { EvolutionDraftMode } from "@/lib/inpatient/evolution-context";
import {
  formatTimelineBlock,
  formatUnitLimitations,
  TRANSFER_CLASS_LABELS,
  type TimelineEvent,
} from "@/lib/inpatient/chart-timeline";
import { formatPhysicalExamBlock } from "@/lib/inpatient/physical-exam-defaults";
import {
  pickUltimoComDispositivo,
  pickUltimoVital,
  summarizeDevices,
  summarizeVitals,
} from "@/lib/inpatient/vital-devices";
import { computeInternationDay } from "@/lib/inpatient/internation-day";
import type {
  EpisodeConduct,
  EpisodeEvolution,
  EpisodeMedReconciliation,
  EpisodePrescription,
  EpisodeProblem,
  EpisodeTreatmentResponse,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";

const CORE_STATUS_LABEL: Record<string, string> = {
  nenhum: "Nenhum",
  aguardando: "Aguardando autorização",
  autorizado: "Autorizado",
  negado: "Negado",
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function p(text: string, bold = false): string {
  const inner = esc(text);
  return bold ? `<p><strong>${inner}</strong></p>` : `<p>${inner}</p>`;
}

function plainSectionsToHtml(title: string, body: string): string {
  const parts = [p(title, true)];
  for (const line of body.split("\n")) {
    if (line.trim()) parts.push(p(line));
  }
  return parts.join("\n");
}

function formatTreatmentResponses(
  problems: EpisodeProblem[],
  responses: EpisodeTreatmentResponse[],
): string {
  const active = problems.filter((pr) => pr.active);
  if (active.length === 0) return "Nenhum problema ativo listado.";
  const byProblem = new Map(responses.map((r) => [r.problem_id, r]));
  const statusLabel: Record<string, string> = {
    melhora: "Melhora",
    sem_mudanca: "Sem mudança",
    piora: "Piora",
  };
  return active
    .map((pr) => {
      const r = byProblem.get(pr.id);
      if (!r) return `• ${pr.text}: [registrar resposta ao tratamento]`;
      const note = r.notes.trim() ? ` — ${r.notes.trim()}` : "";
      return `• ${pr.text}: ${statusLabel[r.response_status] ?? r.response_status}${note}`;
    })
    .join("\n");
}

function buildRegulationBaseSections(input: {
  patient: Patient;
  episode: PatientEpisode;
  conduct: EpisodeConduct;
  ctx: EvolutionDraftContext;
  timeline: TimelineEvent[];
  problems: EpisodeProblem[];
  treatmentResponses: EpisodeTreatmentResponse[];
  since?: string | null;
}): string[] {
  const { patient, episode, conduct, ctx } = input;
  const parts: string[] = [];

  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const day = computeInternationDay(episode);
  const admission = new Date(episode.created_at).toLocaleString("pt-BR");
  parts.push(
    p(
      `${patient.full_name}${age?.years != null ? `, ${age.years} anos` : ""}, leito ${episode.bed?.trim() || "—"}, internado(a) desde ${admission} (${day}º dia).`,
    ),
  );
  parts.push(p(`Diagnóstico principal: ${episode.diagnosis?.trim() || "—"}`));

  const ultimoVital = pickUltimoVital(ctx.vitalRecords);
  const ultimoDevice = pickUltimoComDispositivo(ctx.vitalRecords);
  parts.push(p(`Sinais vitais (último): ${summarizeVitals(ultimoVital)}`));
  parts.push(p(`Dispositivos: ${summarizeDevices(ultimoDevice)}`));

  const lastPhysical = ctx.physicalExams[0];
  if (lastPhysical) {
    parts.push(p("Exame físico atual:", true));
    for (const line of formatPhysicalExamBlock(lastPhysical.systems).split("\n")) {
      parts.push(p(line));
    }
  }

  if (ctx.activePrescriptionLines?.length) {
    parts.push(p("Tratamento instituido (prescrição ativa):", true));
    for (const line of ctx.activePrescriptionLines) {
      parts.push(p(`• ${line}`));
    }
  } else if (conduct.conduct_text.trim()) {
    parts.push(p(`Tratamento / conduta: ${conduct.conduct_text.trim()}`));
  }

  parts.push(
    p(
      `Resposta ao tratamento por problema:\n${formatTreatmentResponses(input.problems, input.treatmentResponses)}`,
    ),
  );

  parts.push(
    p(
      `Limitações da unidade atual: ${formatUnitLimitations(
        conduct.unit_limitations,
        conduct.unit_limitation_other,
      )}`,
    ),
  );
  parts.push(p(`Recurso / especialidade necessária: ${conduct.resource_needed.trim() || "—"}`));
  parts.push(
    p(
      `Status CORE: ${CORE_STATUS_LABEL[conduct.core_status] ?? conduct.core_status}`,
    ),
  );
  parts.push(
    p(
      `Classificação médica da transferência: ${TRANSFER_CLASS_LABELS[conduct.transfer_class] ?? conduct.transfer_class}${
        conduct.transfer_class_justification.trim()
          ? ` — ${conduct.transfer_class_justification.trim()}`
          : ""
      }`,
    ),
  );

  if (conduct.contingency_plan.trim()) {
    parts.push(p(`Plano de contingência: ${conduct.contingency_plan.trim()}`));
  }

  parts.push(p("Linha do tempo clínica:", true));
  parts.push(
    p(formatTimelineBlock(input.timeline, input.since ?? undefined)),
  );

  return parts;
}

export function buildEvolutionDraftForMode(
  mode: EvolutionDraftMode,
  input: {
    ctx: EvolutionDraftContext;
    conduct: EpisodeConduct | null;
    timeline: TimelineEvent[];
    problems: EpisodeProblem[];
    treatmentResponses: EpisodeTreatmentResponse[];
    evolutions: EpisodeEvolution[];
    prescriptions: EpisodePrescription[];
    reconciliation: EpisodeMedReconciliation[];
    lastCoreGeneratedAt?: string | null;
  },
): string {
  if (mode === "diaria") {
    return buildEvolutionDraftHtml(input.ctx);
  }

  if (mode === "alta") {
    const draft = buildDischargeDraft({
      patient: input.ctx.patient,
      episode: input.ctx.episode,
      vitalRecords: input.ctx.vitalRecords,
      physicalExams: input.ctx.physicalExams,
      evolutions: input.evolutions,
      prescriptions: input.prescriptions,
      reconciliation: input.reconciliation,
      labValues: input.ctx.labValues ?? [],
      imagingReports: input.ctx.imagingReports ?? [],
      conductText: input.ctx.conductText,
    });
    return plainSectionsToHtml(
      `EVOLUÇÃO — PREPARO DE ALTA — ${new Date().toLocaleDateString("pt-BR")}`,
      `${draft.summary}\n\n--- ORIENTAÇÕES (revise) ---\n${draft.orientations}`,
    );
  }

  const conduct = input.conduct;
  if (!conduct) {
    return buildEvolutionDraftHtml(input.ctx);
  }

  const dateLine = new Date().toLocaleDateString("pt-BR");
  const since =
    mode === "core_atualizacao" ? input.lastCoreGeneratedAt ?? null : null;

  if (mode === "judicializada") {
    const parts = [
      p(`SOLICITAÇÃO — VAGA JUDICIALIZADA — ${dateLine}`, true),
      p(
        `Processo / referência: ${conduct.judicial_process.trim() || "[informar número do processo na aba Conduta]"}`,
      ),
      p(
        conduct.judicial_started_at
          ? `Início da judicialização: ${new Date(conduct.judicial_started_at).toLocaleString("pt-BR")}`
          : "Data de início da judicialização não registrada.",
      ),
      ...buildRegulationBaseSections({
        patient: input.ctx.patient,
        episode: input.ctx.episode,
        conduct,
        ctx: input.ctx,
        timeline: input.timeline,
        problems: input.problems,
        treatmentResponses: input.treatmentResponses,
      }),
      p(
        "Justificativa clínica para vaga judicializada: [descrever necessidade de recurso não disponível na unidade e risco de permanência]",
      ),
    ];
    return parts.join("\n");
  }

  const title =
    mode === "core_inicial"
      ? `SOLICITAÇÃO CORE — ENCAMINHAMENTO INICIAL — ${dateLine}`
      : `ATUALIZAÇÃO DE SOLICITAÇÃO CORE — ${dateLine}`;

  const parts = [
    p(title, true),
    ...buildRegulationBaseSections({
      patient: input.ctx.patient,
      episode: input.ctx.episode,
      conduct,
      ctx: input.ctx,
      timeline: input.timeline,
      problems: input.problems,
      treatmentResponses: input.treatmentResponses,
      since,
    }),
  ];

  if (mode === "core_inicial") {
    parts.push(
      p(
        "Síntese para regulação: [resumir gravidade, estabilidade hemodinâmica, suporte necessário e motivo da transferência]",
      ),
    );
  } else {
    parts.push(
      p(
        "Atualização desde a última solicitação CORE: [intercorrências, resposta ao tratamento, novos exames, mudança de suporte]",
      ),
    );
  }

  return parts.join("\n");
}

export function coreGenerationKindForMode(
  mode: EvolutionDraftMode,
): "core_inicial" | "core_atualizacao" | "judicializada" | null {
  if (mode === "core_inicial") return "core_inicial";
  if (mode === "core_atualizacao") return "core_atualizacao";
  if (mode === "judicializada") return "judicializada";
  return null;
}
