import {
  buildCoreClinicalSnapshot,
  compareCoreClinicalSnapshots,
  type CoreClinicalSnapshot,
} from "@/lib/inpatient/core-clinical-snapshot";
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
import { formatAllTreatmentResponseParagraphs } from "@/lib/inpatient/treatment-response-format";
import { buildActivePrescriptionLines } from "@/lib/inpatient/chart-prescription-summary";
import {
  buildObjectiveWorseningParagraph,
  buildRegulationDocumentSections,
  filterLabsSince,
  formatTreatmentResponsesSinceLastCore,
  formatTransferClassificationBlock,
} from "@/lib/inpatient/core-regulation-sections";
import type { EpisodeImagingReport } from "@/lib/types/inpatient-chart";

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
  prescriptions: EpisodePrescription[],
): string {
  const active = problems.filter((pr) => pr.active);
  if (active.length === 0) return "Nenhum problema ativo listado.";
  const byProblem = new Map(responses.map((r) => [r.problem_id, r]));
  const lines: string[] = [];
  for (const pr of active) {
    const r = byProblem.get(pr.id);
    if (!r) {
      lines.push(`• ${pr.text}: [registrar resposta ao tratamento]`);
      continue;
    }
    lines.push(
      formatAllTreatmentResponseParagraphs({
        problems: [pr],
        responses: [r],
        prescriptions,
      }),
    );
  }
  return lines.join("\n\n");
}

function buildRegulationBaseSections(input: {
  patient: Patient;
  episode: PatientEpisode;
  conduct: EpisodeConduct;
  ctx: EvolutionDraftContext;
  timeline: TimelineEvent[];
  problems: EpisodeProblem[];
  treatmentResponses: EpisodeTreatmentResponse[];
  prescriptions: EpisodePrescription[];
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
      `Resposta ao tratamento por problema:\n${formatTreatmentResponses(
        input.problems,
        input.treatmentResponses,
        input.prescriptions,
      )}`,
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

function appendRegulationDocumentBlocks(
  parts: string[],
  sections: ReturnType<typeof buildRegulationDocumentSections>,
): void {
  if (sections.aviso_gravidade.trim()) {
    parts.push(p(sections.aviso_gravidade));
  }
  parts.push(p("EVOLUÇÃO CLÍNICA REGISTRADA", true));
  parts.push(p(sections.evolucao_registrada));
  parts.push(p("EXAMES LABORATORIAIS", true));
  parts.push(p(sections.exames_laboratoriais));
  parts.push(p("TENDÊNCIA LABORATORIAL", true));
  parts.push(p(sections.tendencia_laboratorial));
  parts.push(p("EXAMES DE IMAGEM", true));
  parts.push(p(sections.exames_imagem));
  parts.push(p("IMPRESSÃO", true));
  parts.push(p(sections.impressao));
  parts.push(p("JUSTIFICATIVA DE TRANSFERÊNCIA", true));
  parts.push(p(sections.justificativa_transferencia));
  parts.push(p(sections.classificacao_transferencia));
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
    imagingReports?: EpisodeImagingReport[];
    lastCoreGeneratedAt?: string | null;
    firstCoreRequestAt?: string | null;
    previousCoreSnapshot?: CoreClinicalSnapshot | null;
    firstCoreSnapshot?: CoreClinicalSnapshot | null;
    currentCoreSnapshot?: CoreClinicalSnapshot | null;
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
  const previousSnap = input.previousCoreSnapshot ?? null;
  const currentSnap =
    input.currentCoreSnapshot ??
    buildCoreClinicalSnapshot({
      vitalRecords: input.ctx.vitalRecords,
      labValues: input.ctx.labValues ?? [],
    });

  const imaging =
    input.imagingReports ?? input.ctx.imagingReports ?? [];
  const allLabs = input.ctx.labValues ?? [];

  if (mode === "judicializada") {
    const regSections = buildRegulationDocumentSections({
      ctx: input.ctx,
      conduct,
      problems: input.problems,
      evolutions: input.evolutions,
      imagingReports: imaging,
    });
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
      p(
        "Documento para regulação judicial — a sequência factual da linha do tempo tem peso central; o sistema não atribui urgência automática à transferência.",
      ),
      p("LINHA DO TEMPO (detalhada)", true),
      p(formatTimelineBlock(input.timeline)),
      ...buildRegulationBaseSections({
        patient: input.ctx.patient,
        episode: input.ctx.episode,
        conduct,
        ctx: input.ctx,
        timeline: input.timeline,
        problems: input.problems,
        treatmentResponses: input.treatmentResponses,
        prescriptions: input.prescriptions,
      }),
      p("JUSTIFICATIVA CLÍNICA (VAGA JUDICIALIZADA)", true),
      p(regSections.justificativa_transferencia),
      p(
        "Fundamentação adicional: [descrever risco de permanência na unidade atual e recurso indisponível localmente]",
      ),
    ];
    appendRegulationDocumentBlocks(parts, regSections);
    return parts.join("\n");
  }

  const title =
    mode === "core_inicial"
      ? `EVOLUÇÃO MÉDICA / SOLICITAÇÃO DE TRANSFERÊNCIA VIA CORE — ${dateLine}`
      : `ATUALIZAÇÃO CORE — ${dateLine}`;

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
      prescriptions: input.prescriptions,
      since,
    }),
  ];

  const labsForDoc =
    mode === "core_atualizacao"
      ? filterLabsSince(allLabs, since)
      : allLabs;
  const regSections = buildRegulationDocumentSections({
    ctx: input.ctx,
    conduct,
    problems: input.problems,
    evolutions: input.evolutions,
    imagingReports: imaging,
    labsSince: labsForDoc,
  });
  appendRegulationDocumentBlocks(parts, regSections);

  if (mode === "core_inicial") {
    parts.push(p("SÍNTESE PARA REGULAÇÃO", true));
    parts.push(p(regSections.justificativa_transferencia));
    parts.push(
      p(
        `[Complementar: estabilidade hemodinâmica, suportes em uso e expectativa de transferência]`,
      ),
    );
  } else if (mode === "core_atualizacao") {
    const firstAt = input.firstCoreRequestAt;
    if (firstAt) {
      const waitMs = Date.now() - new Date(firstAt).getTime();
      const waitH = Math.max(0, Math.floor(waitMs / (1000 * 60 * 60)));
      parts.push(p("TEMPO AGUARDANDO TRANSFERÊNCIA", true));
      parts.push(
        p(
          `Solicitado: ${new Date(firstAt).toLocaleString("pt-BR")} · Tempo aguardando: ~${waitH}h`,
        ),
      );
      if (input.lastCoreGeneratedAt) {
        parts.push(
          p(
            `Última atualização CORE: ${new Date(input.lastCoreGeneratedAt).toLocaleString("pt-BR")}`,
          ),
        );
      }
    }
    parts.push(p("MUDANÇAS DESDE A ÚLTIMA REFERÊNCIA CORE:", true));
    const diffLines: string[] = [];
    if (previousSnap) {
      for (const line of compareCoreClinicalSnapshots(previousSnap, currentSnap)) {
        diffLines.push(line);
        parts.push(p(line));
      }
    } else {
      parts.push(
        p(
          "Sem snapshot anterior — compare manualmente com a solicitação inicial.",
        ),
      );
    }
    parts.push(p("EXAMES LABORATORIAIS DESDE A ÚLTIMA CORE", true));
    parts.push(
      p(
        labsForDoc.length > 0
          ? regSections.exames_laboratoriais
          : "Nenhum exame laboratorial novo desde a última atualização CORE.",
      ),
    );
    parts.push(p("RESPOSTA AO TRATAMENTO DESDE A ÚLTIMA ATUALIZAÇÃO", true));
    parts.push(
      p(
        formatTreatmentResponsesSinceLastCore({
          problems: input.problems,
          responses: input.treatmentResponses,
          prescriptions: input.prescriptions,
          sinceIso: since,
        }),
      ),
    );
    parts.push(p("EXAMES DE CONTROLE", true));
    parts.push(
      p(
        labsForDoc.length > 0
          ? regSections.exames_laboratoriais
          : "Nenhum exame de controle novo no período.",
      ),
    );
    parts.push(p("TENDÊNCIA", true));
    parts.push(p(regSections.tendencia_laboratorial));

    const activeMeds = buildActivePrescriptionLines(input.prescriptions);
    parts.push(
      p(
        activeMeds.length > 0
          ? `Mantido tratamento com ${activeMeds.join("; ")}.`
          : "Sem medicações ativas registradas na prescrição.",
      ),
    );
    parts.push(
      p(
        formatTreatmentResponsesSinceLastCore({
          problems: input.problems,
          responses: input.treatmentResponses,
          prescriptions: input.prescriptions,
          sinceIso: since,
        }),
      ),
    );

    parts.push(p("PIORA CLÍNICA OBJETIVA", true));
    const initialSnap = input.firstCoreSnapshot ?? null;
    const initialDiff =
      initialSnap && currentSnap
        ? compareCoreClinicalSnapshots(initialSnap, currentSnap)
        : [];
    parts.push(
      p(
        buildObjectiveWorseningParagraph(
          [...diffLines, ...initialDiff],
          input.problems,
          input.treatmentResponses,
        ),
      ),
    );
    if (initialDiff.some((l) => /pior|elevação|queda/i.test(l))) {
      parts.push(
        p(
          `Houve piora desde a solicitação inicial, caracterizada por ${initialDiff.filter((l) => /pior|elevação|queda/i.test(l)).join("; ")}, reforçando a necessidade de avaliação em tempo oportuno.`,
        ),
      );
    }

    parts.push(
      p(
        `Permanece necessária transferência para serviço com ${conduct.resource_needed.trim() || "[recurso necessário]"}.`,
      ),
    );
    if (conduct.transfer_class_confirmed && conduct.transfer_class !== "sem") {
      parts.push(p(formatTransferClassificationBlock(conduct)));
    }
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
