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
  /** Revisão institucional — regras só entram em sugestão se true (PDF 5.14). */
  validadoInstitucionalmente: boolean;
  pattern: RegExp;
  label: string;
  pediatric?: boolean;
  /** Se pediátrico, função opcional com peso em kg */
  buildMeds?: (weightKg: number) => PrescriptionRuleMed[];
  meds: PrescriptionRuleMed[];
};

export const DEFAULT_PRESCRIPTION_RULES: PrescriptionDiagnosisRule[] = [
  {
    id: "itu_pielonefrite",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA 2011 · EAU 2024",
    ativo: true,
    validadoInstitucionalmente: true,
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
    id: "itu_grave",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "IDSA 2011 · EAU 2024",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(itu|pielonefrite|infec[cç][aã]o urin[aá]ria|urosepse)\b[\s\S]{0,50}\b(grave|severa|complicad|sepse|choque|uti)|\b(grave|severa|complicad)\b[\s\S]{0,50}\b(itu|pielonefrite|urosepse)\b/i,
    label: "ITU / pielonefrite grave",
    meds: [
      {
        name: "Piperacilina-Tazobactam",
        dose: "4g+500mg",
        route: "EV",
        frequency: "8/8h",
        indication: "ITU grave",
        durationDays: 10,
      },
      {
        name: "Cefepima",
        dose: "2g",
        route: "EV",
        frequency: "12/12h",
        indication: "ITU grave (alternativa)",
        durationDays: 10,
      },
      {
        name: "Meropenem",
        dose: "1g",
        route: "EV",
        frequency: "8/8h",
        indication: "ITU grave (alternativa)",
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
    validadoInstitucionalmente: true,
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
    validadoInstitucionalmente: true,
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
    id: "celulite_grave",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "IDSA 2014",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(celulite|erisipela)\b[\s\S]{0,50}\b(grave|severa|necrotiz|sepse|choque)|\b(grave|severa|necrotiz)\b[\s\S]{0,50}\b(celulite|erisipela)\b/i,
    label: "Celulite/erisipela grave",
    meds: [
      {
        name: "Cefazolina",
        dose: "1g",
        route: "EV",
        frequency: "8/8h",
        indication: "Celulite grave",
        durationDays: 7,
      },
      {
        name: "Vancomicina",
        dose: "15mg/kg",
        route: "EV",
        frequency: "12/12h",
        indication: "Celulite grave (MRSA / gravidade)",
        durationDays: 7,
      },
      {
        name: "Piperacilina-Tazobactam",
        dose: "4,5g",
        route: "EV",
        frequency: "6/6h",
        indication: "Cobertura gram-neg/anaeróbio se necessário",
        durationDays: 7,
      },
    ],
  },
  {
    id: "sepse_foco_pulmonar",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(sepse|choque s[eé]ptico)\b[\s\S]{0,80}\b(pulmon|pneum|respirat)|\b(pneumonia)\b[\s\S]{0,80}\b(s[eé]ptic|sepse)\b/i,
    label: "Sepse — foco pulmonar",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "Sepse foco pulmonar",
        durationDays: null,
      },
      {
        name: "Claritromicina",
        dose: "500mg",
        route: "EV",
        frequency: "12/12h",
        indication: "Sepse foco pulmonar",
        durationDays: null,
      },
    ],
  },
  {
    id: "sepse_foco_abdominal",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(sepse|choque s[eé]ptico)\b[\s\S]{0,80}\b(abdom|digest|periton|apend|colo|biliar|pancreat)|\b(peritonite|colangite)\b/i,
    label: "Sepse — foco abdominal",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "Sepse foco abdominal",
        durationDays: null,
      },
      {
        name: "Metronidazol",
        dose: "500mg",
        route: "EV",
        frequency: "8/8h",
        indication: "Sepse foco abdominal (alt.: Pipe-Tazo 4,5g 6/6h)",
        durationDays: null,
      },
    ],
  },
  {
    id: "sepse_foco_urinario",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(sepse|choque s[eé]ptico)\b[\s\S]{0,80}\b(urin|pielonefrite|itu|bexiga|prostata)|\b(pielonefrite)\b[\s\S]{0,40}\b(s[eé]ptic|sepse)\b/i,
    label: "Sepse — foco urinário",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "Sepse foco urinário",
        durationDays: null,
      },
      {
        name: "Ciprofloxacino",
        dose: "400mg",
        route: "EV",
        frequency: "12/12h",
        indication: "Sepse foco urinário (alternativa)",
        durationDays: null,
      },
    ],
  },
  {
    id: "sepse_foco_pele",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(sepse|choque s[eé]ptico)\b[\s\S]{0,80}\b(pele|partes moles|celulite|erisipela|ferida|abscesso cut[aâ]neo)|\b(celulite|erisipela)\b[\s\S]{0,40}\b(s[eé]ptic|sepse)\b/i,
    label: "Sepse — foco pele/partes moles",
    meds: [
      {
        name: "Oxacilina",
        dose: "2g",
        route: "EV",
        frequency: "4/4h",
        indication: "Sepse foco pele",
        durationDays: null,
      },
      {
        name: "Clindamicina",
        dose: "600mg",
        route: "EV",
        frequency: "8/8h",
        indication: "Sepse foco pele (associar se necessário)",
        durationDays: null,
      },
    ],
  },
  {
    id: "sepse_foco_corrente",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern:
      /\b(sepse|choque s[eé]ptico|bacteremia)\b[\s\S]{0,80}\b(corrente sangu[ií]nea|hemocultura|endovascular|cateter|central)|\b(bacteremia|hemocultura positiva)\b/i,
    label: "Sepse — corrente sanguínea / cateter",
    meds: [
      {
        name: "Meropenem",
        dose: "1g",
        route: "EV",
        frequency: "8/8h",
        indication: "Sepse corrente sanguínea",
        durationDays: null,
      },
      {
        name: "Vancomicina",
        dose: "15mg/kg",
        route: "EV",
        frequency: "12/12h",
        indication: "Sepse corrente sanguínea",
        durationDays: null,
      },
    ],
  },
  {
    id: "sepse_sem_foco",
    versao: "1.1",
    revisadoEm: "2026-10-08",
    fonte: "Surviving Sepsis 2026 · ILAS 2023 · PDF 2.5",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(sepse|choque s[eé]ptico)\b/i,
    label: "Sepse — foco não definido",
    meds: [
      {
        name: "Cefepima",
        dose: "2g",
        route: "EV",
        frequency: "8/8h",
        indication: "Sepse sem foco definido",
        durationDays: null,
      },
      {
        name: "Metronidazol",
        dose: "500mg",
        route: "EV",
        frequency: "8/8h",
        indication: "Sepse sem foco definido",
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
    validadoInstitucionalmente: true,
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
    validadoInstitucionalmente: true,
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
    validadoInstitucionalmente: true,
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
    validadoInstitucionalmente: true,
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
    id: "cetoacidose",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ADA 2024",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(cetoacidose|cad|estado hiperosmolar|ehh)\b/i,
    label: "Cetoacidose / estado hiperosmolar",
    meds: [
      {
        name: "Insulina Regular",
        dose: "0,1 UI/kg/h",
        route: "EV",
        frequency: "contínua",
        indication: "CAD/EHH",
        durationDays: null,
        useContinuous: true,
      },
    ],
  },
  {
    id: "hda",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ACG 2021 · ESGE 2021/2024",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(hda|hemorragia digestiva alta|melena|hemat[eê]mese)\b/i,
    label: "HDA",
    meds: [
      {
        name: "Pantoprazol",
        dose: "80mg bolus + 8mg/h",
        route: "EV",
        frequency: "contínua 72h",
        indication: "HDA",
        durationDays: 3,
      },
    ],
  },
  {
    id: "abstinencia_alcool",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "ASAM 2020",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(abstin[eê]ncia|delirium tremens|ciwa)\b/i,
    label: "Abstinência alcoólica",
    meds: [
      {
        name: "Tiamina",
        dose: "100–300mg",
        route: "EV",
        frequency: "8/8h",
        indication: "Abstinência alcoólica",
        durationDays: 5,
      },
      {
        name: "Diazepam",
        dose: "por CIWA-Ar",
        route: "VO/EV",
        frequency: "conforme escore",
        indication: "Abstinência alcoólica",
        durationDays: null,
      },
    ],
  },
  {
    id: "pancreatite",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IAP/APA 2013/2020",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(pancreatite)\b/i,
    label: "Pancreatite aguda",
    meds: [
      {
        name: "Enoxaparina",
        dose: "40mg",
        route: "SC",
        frequency: "24/24h",
        indication: "Profilaxia TEV — pancreatite",
        durationDays: null,
      },
      {
        name: "Tramadol",
        dose: "50–100mg",
        route: "EV",
        frequency: "8/8h se dor",
        indication: "Pancreatite",
        durationDays: null,
      },
    ],
  },
  {
    id: "colecistite",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "Tokyo Guidelines 2018",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(colecistite|colangite)\b/i,
    label: "Colecistite/colangite",
    meds: [
      {
        name: "Ceftriaxona",
        dose: "1g",
        route: "EV",
        frequency: "24/24h",
        indication: "Colecistite/colangite",
        durationDays: 8,
      },
      {
        name: "Metronidazol",
        dose: "500mg",
        route: "EV",
        frequency: "8/8h",
        indication: "Colecistite/colangite",
        durationDays: 8,
      },
    ],
  },
  {
    id: "encefalopatia_hepatica",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "AASLD/EASL 2014",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(encefalopatia hep[aá]tica)\b/i,
    label: "Encefalopatia hepática",
    meds: [
      {
        name: "Lactulose",
        dose: "20–40mL",
        route: "VO",
        frequency: "8/8–12/12h",
        indication: "Encefalopatia hepática",
        durationDays: null,
      },
    ],
  },
  {
    id: "neutropenia_febril",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA 2011",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(neutropenia febril|neutrop[eê]nico febril)\b/i,
    label: "Neutropenia febril",
    meds: [
      {
        name: "Cefepima",
        dose: "2g",
        route: "EV",
        frequency: "8/8h",
        indication: "Neutropenia febril",
        durationDays: null,
      },
    ],
  },
  {
    id: "avc_isquemico",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "AHA/ASA 2026",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(avc isqu[eê]mico|ave isqu[eê]mico|acidente vascular isqu[eê]mico)\b/i,
    label: "AVC isquêmico agudo",
    meds: [
      {
        name: "AAS",
        dose: "300mg depois 100mg",
        route: "VO",
        frequency: "24/24h",
        indication: "AVC isquêmico",
        durationDays: null,
      },
      {
        name: "Atorvastatina",
        dose: "80mg",
        route: "VO",
        frequency: "24/24h",
        indication: "AVC isquêmico",
        durationDays: null,
      },
      {
        name: "Enoxaparina",
        dose: "40mg",
        route: "SC",
        frequency: "24/24h",
        indication: "Profilaxia TEV (sem trombólise)",
        durationDays: null,
      },
    ],
  },
  {
    id: "asma_ped",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "GINA 2026",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(asma pedi[aá]trica|broncoespasmo pedi[aá]trico)\b/i,
    label: "Asma pediátrica",
    pediatric: true,
    meds: [],
    buildMeds: (w) => {
      const ml = Math.min(20, Math.round((w / 3) * 10) / 10);
      return [
        {
          name: "Prednisolona",
          dose: `${ml}mL/dia (peso/3, máx 20mL)`,
          route: "VO",
          frequency: "24/24h",
          indication: "Asma pediátrica",
          durationDays: 5,
        },
        {
          name: "Salbutamol spray",
          dose: "2–4 jatos",
          route: "inalatória",
          frequency: "SN broncoespasmo",
          indication: "Asma pediátrica",
          durationDays: 5,
        },
      ];
    },
  },
  {
    id: "diarreia_ped",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "WHO/ESPGHAN",
    ativo: true,
    validadoInstitucionalmente: true,
    pattern: /\b(diarreia|desidrata[cç][aã]o).*(pedi[aá]tric|lactente|crian[cç]a)/i,
    label: "Diarreia/desidratação pediátrica",
    pediatric: true,
    meds: [],
    buildMeds: (w) => [
      {
        name: "Ondansetrona",
        dose: `${Math.round(w * 0.15 * 10) / 10}mg`,
        route: "EV",
        frequency: "8/8h SN",
        indication: "Diarreia pediátrica",
        durationDays: 3,
      },
    ],
  },
  {
    id: "pac_ped",
    versao: "1.0",
    revisadoEm: "2026-09-25",
    fonte: "IDSA/PIDS 2011",
    ativo: true,
    validadoInstitucionalmente: true,
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

export function getPediatricRuleBuilders(): Record<
  string,
  (weightKg: number) => PrescriptionRuleMed[]
> {
  const map: Record<string, (weightKg: number) => PrescriptionRuleMed[]> = {};
  for (const rule of DEFAULT_PRESCRIPTION_RULES) {
    if (rule.buildMeds) map[rule.id] = rule.buildMeds;
  }
  return map;
}

export function matchRulesFromList(
  diagnosis: string | null | undefined,
  weightKg: number | null,
  rules: PrescriptionDiagnosisRule[],
): PrescriptionDiagnosisRule[] {
  const text = diagnosis?.trim() ?? "";
  if (!text) return [];
  const out: PrescriptionDiagnosisRule[] = [];
  for (const rule of rules) {
    if (
      !rule.ativo ||
      !rule.validadoInstitucionalmente ||
      !rule.pattern.test(text)
    ) {
      continue;
    }
    if (rule.pediatric && rule.buildMeds) {
      if (weightKg == null || weightKg <= 0) continue;
    }
    out.push(rule);
  }
  const sepseFoco = out.filter((r) => r.id.startsWith("sepse_foco_"));
  if (sepseFoco.length > 0) {
    return out.filter((r) => r.id !== "sepse_sem_foco");
  }
  if (out.some((r) => r.id === "itu_grave")) {
    return out.filter((r) => r.id !== "itu_pielonefrite");
  }
  if (out.some((r) => r.id === "celulite_grave")) {
    return out.filter((r) => r.id !== "celulite");
  }
  return out;
}

export function matchPrescriptionDiagnosisRules(
  diagnosis: string | null | undefined,
  weightKg: number | null,
): PrescriptionDiagnosisRule[] {
  return matchRulesFromList(diagnosis, weightKg, DEFAULT_PRESCRIPTION_RULES);
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
  const activeValidated = DEFAULT_PRESCRIPTION_RULES.filter(
    (r) => r.ativo && r.validadoInstitucionalmente,
  ).length;
  return {
    version: CLINICAL_RULES_VERSION,
    ruleCount: DEFAULT_PRESCRIPTION_RULES.length,
    activeValidatedCount: activeValidated,
  };
}
