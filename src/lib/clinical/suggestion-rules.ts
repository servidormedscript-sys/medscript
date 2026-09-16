import {
  COMPLEMENTARY_SECTIONS,
  EXAM_SECTIONS,
} from "@/lib/clinical/t0-form-config";
import type { ClinicalSuggestion, VitalSigns } from "@/lib/types/clinical-assessment";
import { TEC_LABELS } from "@/lib/types/clinical-assessment";

type RuleContext = {
  vital: VitalSigns;
  findings: Record<string, boolean>;
  complementary: Record<string, boolean>;
  hasFever: boolean;
};

type SuggestionRule = {
  id: string;
  title: string;
  description: string;
  priority: ClinicalSuggestion["priority"];
  match: (ctx: RuleContext) => boolean;
};

function num(value: string): number | null {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function detectFever(temperature: string): boolean {
  const t = num(temperature);
  return t !== null && t >= 37.8;
}

const RULES: SuggestionRule[] = [
  {
    id: "parada_cardiorresp",
    title: "Parada cardiorrespiratória / colapso",
    description:
      "Paciente irresponsivo sem respiração ou pulso. Acionar protocolo de RCP imediato e suporte avançado de vida.",
    priority: "alta",
    match: ({ findings }) => findings.parada_respiratoria,
  },
  {
    id: "avc_agudo",
    title: "Suspeita de AVC agudo",
    description:
      "Déficit neurológico focal de início agudo. Avaliar escala NIHSS, considerar neuroimagem urgente e janela terapêutica.",
    priority: "alta",
    match: ({ findings }) =>
      findings.deficit_neurologico ||
      (findings.confusao_mental && findings.alteracao_pupilar),
  },
  {
    id: "hemorragia_subaracnoidea",
    title: "Suspeita de hemorragia subaracnóidea",
    description:
      'Cefaleia súbita intensa ("thunderclap"). Neuroimagem urgente e avaliação neurocirúrgica.',
    priority: "alta",
    match: ({ findings }) => findings.cefaleia_subita,
  },
  {
    id: "meningite",
    title: "Suspeita de meningite / infecção do SNC",
    description:
      "Febre associada a rigidez de nuca ou sinais meníngeos. Considerar punção lombar e antibioticoterapia empírica.",
    priority: "alta",
    match: ({ findings, hasFever }) =>
      findings.rigidez_nuca && (hasFever || findings.febre_subjetiva),
  },
  {
    id: "anafilaxia",
    title: "Suspeita de anafilaxia",
    description:
      "Urticária/edema de vias aéreas ou exposição a alérgeno. Adrenalina IM, oxigenoterapia e monitorização.",
    priority: "alta",
    match: ({ findings }) => findings.anafilaxia,
  },
  {
    id: "iam",
    title: "Suspeita de síndrome coronariana aguda",
    description:
      "Dor torácica com possível componente isquêmico. ECG em até 10 min, troponina seriada e estratificação de risco.",
    priority: "alta",
    match: ({ findings }) => findings.dor_toracica,
  },
  {
    id: "tep",
    title: "Suspeita de tromboembolismo pulmonar",
    description:
      "Dispneia aguda com dor pleurítica ou dor panturrilha unilateral. Considerar D-dímero, angioTC ou USG Doppler.",
    priority: "alta",
    match: ({ findings }) =>
      findings.dispneia &&
      (findings.dor_pleuritica || findings.dor_panturrilha),
  },
  {
    id: "tvpe",
    title: "Suspeita de TVP",
    description:
      "Dor/assimetria unilateral de panturrilha com edema. Avaliar Wells e considerar Doppler venoso.",
    priority: "media",
    match: ({ findings }) =>
      findings.dor_panturrilha || (findings.edema_mmii && findings.dor_panturrilha),
  },
  {
    id: "abdome_agudo",
    title: "Suspeita de abdome agudo cirúrgico",
    description:
      "Defesa involuntária ou abdome em tábua. Avaliação cirúrgica urgente e exames de imagem.",
    priority: "alta",
    match: ({ findings }) =>
      findings.defesa_abdominal || findings.dor_abdominal,
  },
  {
    id: "obstrucao_intestinal",
    title: "Suspeita de obstrução intestinal",
    description:
      "Distensão abdominal importante com dor. RX/TC de abdome e avaliação cirúrgica.",
    priority: "media",
    match: ({ findings }) =>
      findings.distensao_abdominal && findings.dor_abdominal,
  },
  {
    id: "hemorragia_digestiva",
    title: "Suspeita de hemorragia digestiva",
    description:
      "Hematemese, melena ou sangramento ativo. Monitorização hemodinâmica e endoscopia conforme estabilidade.",
    priority: "alta",
    match: ({ findings, complementary }) =>
      findings.sangramento_ativo ||
      complementary.hematemese ||
      complementary.melena,
  },
  {
    id: "sepse",
    title: "Suspeita de sepse",
    description:
      "Febre com sinais de disfunção (confusão, hipoperfusão TEC > 6s, taquicardia). Iniciar bundle de sepse.",
    priority: "alta",
    match: ({ findings, hasFever, vital }) => {
      const fc = num(vital.heart_rate);
      return (
        hasFever &&
        (findings.confusao_mental ||
          vital.tec === "gt_6s" ||
          (fc !== null && fc > 100))
      );
    },
  },
  {
    id: "hipoperfusao",
    title: "Sinais de hipoperfusão periférica",
    description:
      "TEC > 6 segundos ou pulso periférico diminuído. Avaliar choque, reposição volêmica e causa base.",
    priority: "alta",
    match: ({ vital, findings }) =>
      vital.tec === "gt_6s" || findings.pulso_diminuido,
  },
  {
    id: "hipoxemia",
    title: "Hipoxemia significativa",
    description:
      "SpO₂ abaixo de 92%. Oxigenoterapia suplementar e investigar causa respiratória.",
    priority: "alta",
    match: ({ vital }) => {
      const spo2 = num(vital.spo2);
      return spo2 !== null && spo2 < 92;
    },
  },
  {
    id: "broncoespasmo",
    title: "Broncoespasmo / crise asmática",
    description:
      "Sibilos ou dispneia. Broncodilatadores, corticoide e avaliar gravidade da crise.",
    priority: "media",
    match: ({ findings }) => findings.sibilos || findings.dispneia,
  },
  {
    id: "cetoacidose",
    title: "Suspeita de distúrbio glicêmico agudo",
    description:
      "Glicemia elevada com poliúria/polidipsia ou alteração de consciência. Dosar glicemia, gasometria e cetonas.",
    priority: "alta",
    match: ({ vital, complementary, findings }) => {
      const glic = num(vital.blood_glucose);
      return (
        (glic !== null && glic > 250) ||
        (complementary.poliuria && (glic !== null && glic > 180)) ||
        (findings.confusao_mental && glic !== null && glic > 250)
      );
    },
  },
  {
    id: "hipoglicemia",
    title: "Suspeita de hipoglicemia",
    description:
      "Glicemia abaixo de 70 mg/dL ou sintomas compatíveis. Administrar glicose e investigar causa.",
    priority: "alta",
    match: ({ vital, findings }) => {
      const glic = num(vital.blood_glucose);
      return (
        (glic !== null && glic < 70) ||
        (findings.sincope && glic !== null && glic < 80)
      );
    },
  },
  {
    id: "itu",
    title: "Suspeita de infecção do trato urinário",
    description:
      "Disúria, polaciúria ou hematúria. Solicitar EAS/urocultura e considerar antibioticoterapia empírica.",
    priority: "media",
    match: ({ complementary, hasFever }) =>
      complementary.disuria ||
      complementary.polaciuria ||
      (complementary.hematuria && hasFever),
  },
  {
    id: "gravidez_ectopica",
    title: "Suspeita de gravidez / complicação obstétrica",
    description:
      "Atraso menstrual ou sangramento vaginal anormal. Beta-hCG e avaliação gineco-obstétrica.",
    priority: "alta",
    match: ({ complementary }) =>
      complementary.atraso_menstrual || complementary.sangramento_vaginal,
  },
  {
    id: "torcao_testicular",
    title: "Suspeita de escroto agudo",
    description:
      "Dor ou edema testicular/escrotal. Doppler urgente para excluir torção testicular.",
    priority: "alta",
    match: ({ complementary }) => complementary.dor_escrotal,
  },
  {
    id: "risco_suicida",
    title: "Risco suicida identificado",
    description:
      "Ideação suicida presente. Avaliação psiquiátrica urgente e medidas de proteção.",
    priority: "alta",
    match: ({ complementary }) => complementary.ideacao_suicida,
  },
  {
    id: "trauma",
    title: "Trauma recente",
    description:
      "História de trauma. Avaliar ABCDE, estabilização e exames conforme mecanismo.",
    priority: "media",
    match: ({ findings }) => findings.trauma_recente,
  },
  {
    id: "celulite",
    title: "Suspeita de infecção de partes moles",
    description:
      "Rubor, calor e dor localizada. Avaliar extensão, marcadores inflamatórios e antibioticoterapia.",
    priority: "media",
    match: ({ findings, hasFever }) =>
      findings.infeccao_membro || (findings.rash && hasFever),
  },
  {
    id: "insuf_cardiaca",
    title: "Suspeita de descompensação cardíaca",
    description:
      "Ortopneia, dispneia paroxística ou edema de MMII. BNP, RX tórax e otimização terapêutica.",
    priority: "media",
    match: ({ complementary, findings }) =>
      complementary.ortopneia ||
      complementary.dispneia_paroxistica ||
      (findings.edema_mmii && findings.dispneia),
  },
];

export function generateSuggestions(
  vital: VitalSigns,
  findings: Record<string, boolean>,
  complementary: Record<string, boolean>
): ClinicalSuggestion[] {
  const hasFever = detectFever(vital.temperature);
  const ctx: RuleContext = { vital, findings, complementary, hasFever };

  const matched = RULES.filter((rule) => rule.match(ctx)).map((rule) => ({
    id: rule.id,
    title: rule.title,
    description: rule.description,
    priority: rule.priority,
  }));

  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  return matched.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

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
    lines.push(
      `- Temperatura: ${vital.temperature}°C${hasFever ? " (FEBRE)" : ""}`
    );
  }
  if (vital.heart_rate) lines.push(`- FC: ${vital.heart_rate} bpm`);
  if (vital.respiratory_rate) lines.push(`- FR: ${vital.respiratory_rate} irpm`);
  if (vital.systolic_bp) lines.push(`- PAS: ${vital.systolic_bp} mmHg`);
  if (vital.spo2) lines.push(`- SpO₂: ${vital.spo2}%`);
  if (vital.weight) lines.push(`- Peso: ${vital.weight} kg`);
  if (vital.tec) {
    const tecLabel = vital.tec in TEC_LABELS ? TEC_LABELS[vital.tec as keyof typeof TEC_LABELS] : vital.tec;
    lines.push(`- TEC: ${tecLabel}`);
  }
  if (vital.blood_glucose) lines.push(`- Glicemia: ${vital.blood_glucose} mg/dL`);

  const labelMap = [...EXAM_SECTIONS, ...COMPLEMENTARY_SECTIONS].reduce<
    Record<string, string>
  >((acc, section) => {
    section.items.forEach((item) => {
      acc[item.id] = item.label;
    });
    return acc;
  }, {});

  const activeFindings = Object.entries(findings).filter(([, v]) => v);
  if (activeFindings.length > 0) {
    lines.push("", "ACHADOS CLÍNICOS:");
    activeFindings.forEach(([id]) => lines.push(`- ${labelMap[id] ?? id}`));
  }

  const activeComp = Object.entries(complementary).filter(([, v]) => v);
  if (activeComp.length > 0) {
    lines.push("", "RELATÓRIO COMPLEMENTAR:");
    activeComp.forEach(([id]) => lines.push(`- ${labelMap[id] ?? id}`));
  }

  if (suggestions.length > 0) {
    lines.push("", "SUGESTÕES CLÍNICAS:");
    suggestions.forEach((s) => lines.push(`- [${s.priority.toUpperCase()}] ${s.title}: ${s.description}`));
  }

  return lines.join("\n");
}
