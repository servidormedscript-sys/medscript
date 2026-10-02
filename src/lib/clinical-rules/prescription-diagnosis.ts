import { CLINICAL_RULES_VERSION } from "@/lib/clinical-rules/version";

export type PrescriptionRuleMed = {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  durationDays?: number | null;
  useContinuous?: boolean;
};

export type PrescriptionDiagnosisRule = {
  id: string;
  versao: string;
  revisadoEm: string;
  fonte: string;
  ativo: boolean;
  pattern: RegExp;
  label: string;
  pediatric?: boolean;
  /** Se pediátrico, função opcional com peso em kg */
  buildMeds?: (weightKg: number) => PrescriptionRuleMed[];
  meds: PrescriptionRuleMed[];
};

const RULES: PrescriptionDiagnosisRule[] = [
  {
    id: "itu_pielonefrite",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA 2011 · EAU 2024",
    ativo: true,
    pattern: /\b(itu|pielonefrite|infec[cç][aã]o urin[aá]ria)\b/i,
    label: "ITU / pielonefrite",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "ITU / pielonefrite",
        durationDays: 10,
      },
    ],
  },
  {
    id: "pac_adulto",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ATS/IDSA 2019 · ATS 2026",
    ativo: true,
    pattern: /\b(pac|pneumonia adquirida na comunidade)\b/i,
    label: "PAC (pneumonia)",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "PAC",
        durationDays: 5,
      },
      {
        name: "Azitromicina",
        dose: "500mg",
        route: "VO/EV",
        frequency: "24/24h",
        indication: "PAC",
        durationDays: 5,
      },
    ],
  },
  {
    id: "celulite",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA 2014",
    ativo: true,
    pattern: /\b(celulite|erisipela)\b/i,
    label: "Celulite/erisipela",
    meds: [
      {
        name: "Cefazolina",
        dose: "1g",
        route: "EV",
        frequency: "8/8h",
        indication: "Celulite/erisipela",
        durationDays: 7,
      },
    ],
  },
  {
    id: "sepse",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "Surviving Sepsis 2026 · ILAS 2023",
    ativo: true,
    pattern: /\b(sepse|choque s[eé]ptico)\b/i,
    label: "Sepse/choque séptico",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "Sepse — ajustar ao foco",
        durationDays: null,
      },
    ],
  },
  {
    id: "tep",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "CHEST 2021 · AHA 2026",
    ativo: true,
    pattern: /\b(tep|embolia pulmonar)\b/i,
    label: "TEP",
    meds: [
      {
        name: "Enoxaparina",
        dose: "1mg/kg",
        route: "SC",
        frequency: "12/12h",
        indication: "TEP",
        durationDays: null,
      },
    ],
  },
  {
    id: "icc_eap",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ESC 2021/2023 · AHA/ACC/HFSA 2022",
    ativo: true,
    pattern: /\b(icc|insufici[eê]ncia card[ií]aca|eap|edema agudo de pulm[aã]o)\b/i,
    label: "ICC descompensada / EAP",
    meds: [
      {
        name: "Furosemida",
        dose: "40–80mg",
        route: "EV",
        frequency: "bolus — titular",
        indication: "ICC/EAP",
        durationDays: null,
      },
    ],
  },
  {
    id: "dpoc",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "GOLD 2026",
    ativo: true,
    pattern: /\b(dpoc|doen[cç]a pulmonar obstrutiva)\b/i,
    label: "DPOC",
    meds: [
      {
        name: "Prednisona",
        dose: "40mg",
        route: "VO",
        frequency: "24/24h",
        indication: "DPOC exacerbada",
        durationDays: 5,
      },
    ],
  },
  {
    id: "asma",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "GINA 2026",
    ativo: true,
    pattern: /\b(asma|broncoespasmo)\b/i,
    label: "Asma/broncoespasmo",
    meds: [
      {
        name: "Prednisona",
        dose: "40–50mg",
        route: "VO",
        frequency: "24/24h",
        indication: "Asma/broncoespasmo",
        durationDays: 5,
      },
    ],
  },
  {
    id: "pac_ped",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA/PIDS 2011",
    ativo: true,
    pattern: /\b(pac pedi[aá]trica|pneumonia pedi[aá]trica)\b/i,
    label: "PAC pediátrica",
    pediatric: true,
    meds: [],
    buildMeds: (w) => {
      const daily = w * 100;
      const perDose = Math.round((daily / 2) * 10) / 10;
      return [
        {
          name: "Ceftriaxona",
          dose: `${perDose}mg (100mg/kg/dia ÷2)`,
          route: "EV",
          frequency: "12/12h",
          indication: "PAC pediátrica",
          durationDays: 7,
        },
      ];
    },
  },
];

export function matchPrescriptionDiagnosisRules(
  diagnosis: string | null | undefined,
  weightKg: number | null,
): PrescriptionDiagnosisRule[] {
  const text = diagnosis?.trim() ?? "";
  if (!text) return [];
  const out: PrescriptionDiagnosisRule[] = [];
  for (const rule of RULES) {
    if (!rule.ativo || !rule.pattern.test(text)) continue;
    if (rule.pediatric && rule.buildMeds) {
      if (weightKg == null || weightKg <= 0) continue;
    }
    out.push(rule);
  }
  return out;
}

export function medsForRule(
  rule: PrescriptionDiagnosisRule,
  weightKg: number | null,
): PrescriptionRuleMed[] {
  if (rule.buildMeds && weightKg != null && weightKg > 0) {
    return rule.buildMeds(weightKg);
  }
  return rule.meds;
}

export function getClinicalRulesMeta() {
  return { version: CLINICAL_RULES_VERSION, ruleCount: RULES.length };
}
