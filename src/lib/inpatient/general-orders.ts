export const GENERAL_ORDER_ITEMS: { id: string; text: string }[] = [
  {
    id: "o2_sat",
    text: "O2 sob cateter/máscara se SatO2 < 92%",
  },
  {
    id: "comunicar",
    text: "Comunicar intercorrências/anormalidades à equipe médica",
  },
  {
    id: "dipirona",
    text: "Dipirona 1g EV 6/6h se dor ou febre (Tax ≥ 37,8°C)",
  },
  {
    id: "ondansetrona",
    text: "Ondansetrona 4mg EV 8/8h se náusea ou vômito",
  },
  {
    id: "insulina_escala",
    text:
      "Insulina Regular Humana (IRH) conforme protocolo de escala móvel da instituição, se HGT alterado",
  },
  {
    id: "glicose_hipo",
    text: "Glicose Hipertônica 50% 2 ampolas EV se HGT < 70 mg/dL",
  },
];

export const DIET_OPTIONS: { value: string; label: string }[] = [
  { value: "dieta_oral_geral", label: "Dieta oral geral" },
  { value: "branda_pastosa", label: "Branda-pastosa" },
  { value: "zero", label: "Zero" },
  { value: "enteral", label: "Enteral" },
  { value: "parenteral", label: "Parenteral" },
];

export const VITALS_FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "2_2h", label: "2/2h" },
  { value: "4_4h", label: "4/4h" },
  { value: "6_6h", label: "6/6h" },
  { value: "8_8h_hgt", label: "8/8h + HGT" },
];

export type PaduaFlags = Record<string, boolean>;

export const PADUA_ITEMS: { id: string; label: string; points: number }[] = [
  { id: "cancer", label: "Câncer ativo", points: 3 },
  { id: "tev_previo", label: "TEV prévio", points: 3 },
  { id: "mobilidade", label: "Mobilidade reduzida ≥3 dias", points: 3 },
  { id: "trombofilia", label: "Trombofilia", points: 3 },
  { id: "trauma_cirurgia", label: "Trauma/cirurgia ≤1 mês", points: 2 },
  { id: "idade70", label: "Idade ≥70", points: 1 },
  { id: "ic_resp", label: "IC/insuf. respiratória", points: 1 },
  { id: "iam_avc", label: "IAM/AVC agudo", points: 1 },
  { id: "infeccao", label: "Infecção aguda/doença reumatológica", points: 1 },
  { id: "obesidade", label: "Obesidade IMC≥30", points: 1 },
  { id: "hormonio", label: "Terapia hormonal", points: 1 },
];

export function scorePadua(flags: PaduaFlags): number {
  let total = 0;
  for (const item of PADUA_ITEMS) {
    if (flags[item.id]) total += item.points;
  }
  return total;
}

export function paduaHighRisk(flags: PaduaFlags): boolean {
  return scorePadua(flags) >= 4;
}

export function suggestTevProphylaxis(input: {
  padua: PaduaFlags;
  ageYears: number | null;
  weightKg: number | null;
  creatinineMgDl?: number | null;
  sexFemale?: boolean;
}): string | null {
  if (!paduaHighRisk(input.padua)) {
    return "Risco TEV baixo pelo Padua (<4) — considerar deambulação ou profilaxia mecânica conforme caso.";
  }

  let clcr: number | null = null;
  if (
    input.creatinineMgDl != null &&
    input.creatinineMgDl > 0 &&
    input.ageYears != null &&
    input.weightKg != null
  ) {
    clcr =
      ((140 - input.ageYears) * input.weightKg) /
      (72 * input.creatinineMgDl);
    if (input.sexFemale) clcr *= 0.85;
  }

  const reduce =
    (clcr != null && clcr < 30) ||
    (input.ageYears != null && input.ageYears >= 75) ||
    (input.weightKg != null && input.weightKg < 50);

  if (reduce) {
    return "Alto risco Padua (≥4): Enoxaparina 20mg SC 1x/dia (ajuste renal/idade/peso) ou HNF 5.000UI SC 12/12h — revise antes de prescrever.";
  }
  return "Alto risco Padua (≥4): Enoxaparina 40mg SC 1x/dia — revise antes de prescrever.";
}
