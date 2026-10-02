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

export type CapriniFlags = Record<string, boolean>;

/** Subconjunto do Caprini (cirúrgico) — pontos conforme especificação 2.5. */
export const CAPRINI_ITEMS: { id: string; label: string; points: number }[] = [
  { id: "idade_41_60", label: "Idade 41–60 anos", points: 1 },
  { id: "cirurgia_menor", label: "Cirurgia menor planejada", points: 1 },
  { id: "varizes", label: "Varizes / edema de MMII", points: 1 },
  { id: "obesidade", label: "Obesidade (IMC ≥ 30)", points: 1 },
  { id: "iam", label: "IAM agudo", points: 1 },
  { id: "icc", label: "IC / insuficiência respiratória", points: 1 },
  { id: "sepse", label: "Sepse / pneumonia grave", points: 1 },
  { id: "idade_61_74", label: "Idade 61–74 anos", points: 2 },
  { id: "cirurgia_maior", label: "Cirurgia maior > 45 min", points: 2 },
  { id: "cancer", label: "Neoplasia maligna ativa", points: 2 },
  { id: "laparoscopia", label: "Laparoscopia > 45 min", points: 2 },
  { id: "idade_75", label: "Idade ≥ 75 anos", points: 3 },
  { id: "tev_previo", label: "TEV/TVP prévio", points: 3 },
  { id: "trombofilia", label: "Trombofilia conhecida", points: 3 },
  { id: "avc_recente", label: "AVC < 1 mês", points: 5 },
  { id: "trauma_multiplo", label: "Trauma múltiplo", points: 5 },
  { id: "artroplastia", label: "Artroplastia / fratura de quadril", points: 5 },
  { id: "lesao_medular", label: "Lesão medular aguda < 1 mês", points: 5 },
];

export function scoreCaprini(flags: CapriniFlags): number {
  let total = 0;
  for (const item of CAPRINI_ITEMS) {
    if (flags[item.id]) total += item.points;
  }
  return total;
}

export function capriniRiskLabel(total: number): string {
  if (total === 0) return "Risco muito baixo — deambulação precoce";
  if (total <= 2) return "Risco baixo — considerar profilaxia mecânica";
  if (total <= 4) return "Risco moderado — farmacológica ou mecânica";
  return "Risco alto — farmacológica + mecânica";
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

export function suggestCombinedTevProphylaxis(input: {
  padua: PaduaFlags;
  caprini: CapriniFlags;
  ageYears: number | null;
  weightKg: number | null;
  creatinineMgDl?: number | null;
  sexFemale?: boolean;
}): string {
  const paduaMsg = suggestTevProphylaxis({
    padua: input.padua,
    ageYears: input.ageYears,
    weightKg: input.weightKg,
    creatinineMgDl: input.creatinineMgDl,
    sexFemale: input.sexFemale,
  });
  const capTotal = scoreCaprini(input.caprini);
  const capLabel = capriniRiskLabel(capTotal);
  const capDetail =
    capTotal > 0
      ? `Caprini ${capTotal} pts — ${capLabel}.`
      : "Caprini: nenhum fator marcado.";

  if (paduaHighRisk(input.padua)) {
    return `${paduaMsg} ${capDetail}`;
  }
  if (capTotal >= 3) {
    return `${capDetail} Revise dose/ajuste renal (Cockcroft-Gault) antes de prescrever.`;
  }
  if (paduaMsg) return `${paduaMsg} ${capDetail}`;
  return capDetail;
}
