export const INPATIENT_SPECIALTY_OPTIONS = [
  { key: "clinica_medica", label: "Clínica Médica" },
  { key: "cirurgia_geral", label: "Cirurgia Geral" },
  { key: "cardiologia", label: "Cardiologia" },
  { key: "neurologia", label: "Neurologia" },
  { key: "pediatria", label: "Pediatria" },
  { key: "ortopedia", label: "Ortopedia" },
  { key: "uti", label: "UTI" },
  { key: "obstetricia", label: "Obstetrícia" },
  { key: "psiquiatria", label: "Psiquiatria" },
  { key: "pneumologia", label: "Pneumologia" },
  { key: "outra", label: "Outra" },
] as const;

export type InpatientSpecialtyKey =
  (typeof INPATIENT_SPECIALTY_OPTIONS)[number]["key"];

const LABEL_BY_KEY = new Map(
  INPATIENT_SPECIALTY_OPTIONS.map((o) => [o.key, o.label]),
);

export function specialtyLabel(key: string): string {
  return LABEL_BY_KEY.get(key as InpatientSpecialtyKey) ?? key;
}

type InferenceRule = {
  key: InpatientSpecialtyKey;
  pattern: RegExp;
};

const INFERENCE_RULES: InferenceRule[] = [
  { key: "cardiologia", pattern: /\b(icc|iam|sca|insufici[eê]ncia card[ií]aca|tep)\b/i },
  { key: "neurologia", pattern: /\b(avc|ave|acidente vascular)\b/i },
  {
    key: "pneumologia",
    pattern: /\b(dpoc|asma|pac|pneumonia|insufici[eê]ncia respirat[oó]ria)\b/i,
  },
  { key: "pediatria", pattern: /\b(pedi[aá]tric|lactente|neonato)\b/i },
  { key: "ortopedia", pattern: /\b(fratura|ortop[eé]dic)\b/i },
  { key: "obstetricia", pattern: /\b(gestante|obst[eé]tric|parto|pr[eé]-ecl[aâ]mpsia)\b/i },
  { key: "psiquiatria", pattern: /\b(psiqui[aá]tr|suic[ií]dio|del[ií]rio)\b/i },
  { key: "uti", pattern: /\b(uti|sepse|choque|ventila[cç][aã]o mec[aâ]nica)\b/i },
  { key: "cirurgia_geral", pattern: /\b(p[oó]s[- ]operat|abdome agudo|apendicite|colecistite)\b/i },
  { key: "clinica_medica", pattern: /\b(itu|pielonefrite|dm descompensad|drc|lra)\b/i },
];

export function inferSpecialtyFromDiagnosis(
  diagnosis: string | null | undefined,
): InpatientSpecialtyKey | null {
  const text = diagnosis?.trim();
  if (!text) return null;
  for (const rule of INFERENCE_RULES) {
    if (rule.pattern.test(text)) return rule.key;
  }
  return null;
}

export function resolveEpisodeSpecialty(input: {
  care_specialty: string | null | undefined;
  diagnosis: string | null | undefined;
}): { key: InpatientSpecialtyKey; inferred: boolean } | null {
  const manual = input.care_specialty?.trim();
  if (manual && LABEL_BY_KEY.has(manual as InpatientSpecialtyKey)) {
    return { key: manual as InpatientSpecialtyKey, inferred: false };
  }
  const inferred = inferSpecialtyFromDiagnosis(input.diagnosis);
  if (!inferred) return null;
  return { key: inferred, inferred: true };
}
