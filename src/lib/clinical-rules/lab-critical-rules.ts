import type { PrescriptionInput } from "@/lib/types/inpatient-chart";
import type { EpisodeLabValue } from "@/lib/types/inpatient-chart";

export type SerializedLabCriticalRule = {
  id: string;
  versao: string;
  revisadoEm: string;
  fonte: string;
  ativo: boolean;
  validadoInstitucionalmente: boolean;
  analyte_key: string;
  op: "gte" | "lte";
  threshold: number;
  title: string;
  detail: string;
  prescriptions: PrescriptionInput[];
};

export type CriticalLabConduct = {
  id: string;
  title: string;
  detail: string;
  source: string;
  prescriptions: PrescriptionInput[];
};

const DISCLAIMER =
  "Sugestão de conduta por regra simples — sempre revise antes de usar, não substitui julgamento clínico.";

export function criticalConductDisclaimer(): string {
  return DISCLAIMER;
}

export const DEFAULT_LAB_CRITICAL_RULES: SerializedLabCriticalRule[] = [
  {
    id: "na_high",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "Adrogué & Madias, NEJM 2000 · StatPearls 2025",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "sodio",
    op: "gte",
    threshold: 160,
    title: "Hipernatremia grave",
    detail:
      "Soro Glicosado 5%, corrigir devagar (máx. ~8–10 mEq/L/24h).",
    prescriptions: [
      {
        name: "Soro Glicosado 5%",
        dose: "conforme cálculo de déficit",
        route: "EV",
        frequency: "titulada",
        indication: "Hipernatremia grave",
        use_continuous: true,
      },
    ],
  },
  {
    id: "na_low",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "Spasovski 2014 · NDT 2024",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "sodio",
    op: "lte",
    threshold: 120,
    title: "Hiponatremia grave",
    detail:
      "Avaliar volemia; considerar salina hipertônica se sintomática (meta 4–6 mEq/L nas 6h iniciais).",
    prescriptions: [],
  },
  {
    id: "k_high",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "UK Kidney Association 2023",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "potassio",
    op: "gte",
    threshold: 6.5,
    title: "Hipercalemia grave",
    detail:
      "Gluconato de Cálcio 10% 30mL EV em 10min + Insulina Regular 10UI + Glicose 25g EV, HGT seriado.",
    prescriptions: [
      {
        name: "Gluconato de Cálcio 10%",
        dose: "30mL",
        route: "EV",
        frequency: "em 10min — repetir se ECG não melhorar",
        indication: "Hipercalemia grave",
        use_continuous: false,
      },
      {
        name: "Insulina Regular",
        dose: "10UI",
        route: "EV",
        frequency: "dose única",
        indication: "Hipercalemia grave",
        use_continuous: false,
      },
      {
        name: "Glicose",
        dose: "25g",
        route: "EV",
        frequency: "dose única",
        indication: "Hipercalemia grave",
        use_continuous: false,
      },
    ],
  },
  {
    id: "k_low",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "UK Kidney Association 2023",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "potassio",
    op: "lte",
    threshold: 2.5,
    title: "Hipocalemia grave",
    detail:
      "Repor com cautela na velocidade; monitorização cardíaca se reposição rápida.",
    prescriptions: [],
  },
  {
    id: "glu_low",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ADA Standards of Care 2024/2026",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "glicemia",
    op: "lte",
    threshold: 60,
    title: "Hipoglicemia",
    detail: "Glicose 50%, 20–40mL EV dose única; repetir HGT em 15min.",
    prescriptions: [
      {
        name: "Glicose 50%",
        dose: "20–40mL",
        route: "EV",
        frequency: "dose única",
        indication: "Hipoglicemia",
        use_continuous: false,
      },
    ],
  },
  {
    id: "lac_high",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "Surviving Sepsis Campaign 2026 · ILAS 2023",
    ativo: true,
    validadoInstitucionalmente: true,
    analyte_key: "lactato",
    op: "gte",
    threshold: 4,
    title: "Lactato elevado",
    detail:
      "Reavaliar perfusão/reanimação volêmica; considerar sepse/choque.",
    prescriptions: [],
  },
];

function latestValue(
  values: EpisodeLabValue[],
  key: string,
): number | null {
  const row = values
    .filter((v) => v.analyte_key === key)
    .sort(
      (a, b) =>
        new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
    )[0];
  return row?.value ?? null;
}

function ruleMatches(
  rule: SerializedLabCriticalRule,
  value: number,
): boolean {
  if (!rule.ativo || !rule.validadoInstitucionalmente) return false;
  return rule.op === "gte" ? value >= rule.threshold : value <= rule.threshold;
}

export function mergeDefaultLabRules(
  stored: SerializedLabCriticalRule[],
): SerializedLabCriticalRule[] {
  const byId = new Map(stored.map((r) => [r.id, r]));
  for (const d of DEFAULT_LAB_CRITICAL_RULES) {
    if (!byId.has(d.id)) byId.set(d.id, d);
  }
  return [...byId.values()];
}

export function parseStoredLabRules(json: unknown): SerializedLabCriticalRule[] {
  if (!Array.isArray(json) || json.length === 0) {
    return DEFAULT_LAB_CRITICAL_RULES;
  }
  return mergeDefaultLabRules(json as SerializedLabCriticalRule[]);
}

export function computeCriticalLabConductsFromRules(
  values: EpisodeLabValue[],
  rules: SerializedLabCriticalRule[],
): CriticalLabConduct[] {
  const out: CriticalLabConduct[] = [];
  for (const rule of rules) {
    const v = latestValue(values, rule.analyte_key);
    if (v == null) continue;
    if (!ruleMatches(rule, v)) continue;
    out.push({
      id: rule.id,
      title: rule.title,
      detail: rule.detail,
      source: rule.fonte,
      prescriptions: rule.prescriptions ?? [],
    });
  }
  return out;
}

export function computeCriticalLabConducts(
  values: EpisodeLabValue[],
  rules?: SerializedLabCriticalRule[],
): CriticalLabConduct[] {
  const list = rules ?? DEFAULT_LAB_CRITICAL_RULES;
  return computeCriticalLabConductsFromRules(values, list);
}
