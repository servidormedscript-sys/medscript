import type {
  PhysicalExamSystemKey,
  PhysicalExamSystemState,
  PhysicalExamSystems,
} from "@/lib/types/inpatient-chart";

export const PHYSICAL_EXAM_SYSTEM_ORDER: PhysicalExamSystemKey[] = [
  "estado_geral",
  "cardiovascular",
  "respiratorio",
  "abdome",
  "extremidades",
  "neurologico",
  "pele_mucosas",
];

export const PHYSICAL_EXAM_SYSTEM_LABELS: Record<PhysicalExamSystemKey, string> =
  {
    estado_geral: "Estado geral",
    cardiovascular: "Cardiovascular (ACV)",
    respiratorio: "Respiratório (AR)",
    abdome: "Abdome",
    extremidades: "Extremidades",
    neurologico: "Neurológico",
    pele_mucosas: "Pele / mucosas",
  };

export const PHYSICAL_EXAM_NORMAL_TEXT: Record<PhysicalExamSystemKey, string> = {
  estado_geral: "BEG, LOTE, CHAAA",
  cardiovascular: "RR2T, BNF, sem sopros",
  respiratorio: "MVUA, ARA",
  abdome:
    "Normotenso, RH+, indolor à palpação superficial e profunda, sem massas ou visceromegalias palpáveis, sem sinais de abdome agudo",
  extremidades:
    "Aquecidas e perfundidas, TEC < 3s, sem edema. Pulsos pediosos e tibial posterior palpáveis, cheios e simétricos. Pés sem úlceras, lesões, sinais de micose, proeminências ósseas ou deformidades",
  neurologico:
    "Consciente, orientado(a), fala preservada, sem déficit motor focal evidente, marcha preservada conforme tolerância, pares cranianos sem alterações grosseiras ao exame",
  pele_mucosas: "Sem lesões cutâneas ativas",
};

export function emptyPhysicalExamSystems(): PhysicalExamSystems {
  const systems = {} as PhysicalExamSystems;
  for (const key of PHYSICAL_EXAM_SYSTEM_ORDER) {
    systems[key] = { altered: false, note: "" };
  }
  return systems;
}

export function resolveSystemText(
  key: PhysicalExamSystemKey,
  state: PhysicalExamSystemState,
): string {
  if (state.altered && state.note.trim()) {
    return state.note.trim();
  }
  return PHYSICAL_EXAM_NORMAL_TEXT[key];
}

export function formatPhysicalExamBlock(systems: PhysicalExamSystems): string {
  return PHYSICAL_EXAM_SYSTEM_ORDER
    .map((key) => {
      const label = PHYSICAL_EXAM_SYSTEM_LABELS[key];
      const text = resolveSystemText(key, systems[key]);
      return `${label}: ${text}`;
    })
    .join("\n");
}

export function parsePhysicalExamSystems(
  raw: unknown,
): PhysicalExamSystems {
  const base = emptyPhysicalExamSystems();
  if (!raw || typeof raw !== "object") return base;

  for (const key of PHYSICAL_EXAM_SYSTEM_ORDER) {
    const entry = (raw as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object") continue;
    const altered = Boolean((entry as { altered?: unknown }).altered);
    const note =
      typeof (entry as { note?: unknown }).note === "string"
        ? (entry as { note: string }).note
        : "";
    base[key] = { altered, note };
  }
  return base;
}
