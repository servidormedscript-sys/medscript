import type { ClinicalProtocol } from "./types";

export const CLINICAL_PROTOCOLS: ClinicalProtocol[] = [
  // Emergência / Reanimação (10)
  {
    id: "pcr-adulto",
    categoryId: "emergencia",
    name: "PCR em Adulto",
    summary: "Reanimação cardiopulmonar e drogas vasopressoras.",
    keywords: ["parada", "rcp", "adrenalina", "amiodarona"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "pcr-pediatria",
    categoryId: "emergencia",
    name: "PCR em Pediatria",
    summary: "RCP pediátrica com doses por peso.",
    keywords: ["parada", "pediatria", "adrenalina", "criança"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "anafilaxia",
    categoryId: "emergencia",
    name: "Anafilaxia",
    summary: "Adrenalina IM e medidas de suporte imediato.",
    keywords: ["alergia", "urticária", "broncoespasmo", "adrenalina"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "isr",
    categoryId: "emergencia",
    name: "Intubação de Sequência Rápida",
    summary: "Pré-medicação, indução e bloqueio neuromuscular.",
    keywords: ["intubação", "etomidato", "succinilcolina", "rocurônio"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "bradicardia",
    categoryId: "emergencia",
    name: "Bradicardia Sintomática",
    summary: "Atropina e marcapasso conforme estabilidade.",
    keywords: ["bradicardia", "atropina", "marcapasso"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "taquicardia-instavel",
    categoryId: "emergencia",
    name: "Taquicardia Instável",
    summary: "Cardioversão e antiarrítmicos de urgência.",
    keywords: ["taquicardia", "cardioversão", "amiodarona"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "choque-hemorragico",
    categoryId: "emergencia",
    name: "Choque Hemorrágico",
    summary: "Reposição volêmica e hemoderivados.",
    keywords: ["hemorragia", "choque", "cristaloides", "sangue"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "sepse-choque",
    categoryId: "emergencia",
    name: "Sepse / Choque Séptico",
    summary: "qSOFA, bundle da 1ª hora e reavaliação de perfusão.",
    keywords: ["sepse", "lactato", "antibiótico", "30 ml/kg"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "trauma-grave",
    categoryId: "emergencia",
    name: "Trauma Grave",
    summary: "ABCDE, controle de hemorragia e links para choque/ISR.",
    keywords: ["trauma", "abcde", "politrauma"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "isquemia-arterial-membro",
    categoryId: "emergencia",
    name: "Isquemia Arterial Aguda",
    summary: "6 P's e conduta vascular urgente.",
    keywords: ["isquemia", "membro", "pulso", "embolia"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },

  // Cardiologia — Categoria B (módulos interativos)
  {
    id: "taquiarritmias",
    categoryId: "cardiologia",
    name: "Taquiarritmias",
    summary: "TSVP, FA/Flutter, TV com pulso — instabilidade, cardioversão e escores.",
    keywords: ["taquicardia", "adenosina", "cardioversão", "cha2ds2"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "bradiarritmias",
    categoryId: "cardiologia",
    name: "Bradiarritmias",
    summary: "Bradicardia sintomática — atropina, marcapasso e infusões.",
    keywords: ["bradicardia", "atropina", "marcapasso"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "iam-supra-st",
    categoryId: "cardiologia",
    name: "IAM com Supra de ST",
    summary: "Reperfusão, GRACE, antiplaquetários e anticoagulação.",
    keywords: ["iam", "stemi", "fibrinólise", "grace"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "crise-hipertensiva",
    categoryId: "cardiologia",
    name: "Crise Hipertensiva",
    summary: "Emergência vs urgência, subtipo e metas pressóricas.",
    keywords: ["hipertensão", "loa", "nitroprussiato", "labetalol"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "edema-pulmao",
    categoryId: "cardiologia",
    name: "Edema Agudo de Pulmão",
    summary: "Perfil hemodinâmico, diurético, morfina e estabilização.",
    keywords: ["eap", "furosemida", "nitroglicerina"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "ic-aguda-descompensada",
    categoryId: "cardiologia",
    name: "IC Aguda Descompensada",
    summary: "Perfil frio/quente, ADHERE, diuréticos e iSGLT2.",
    keywords: ["ic", "congestão", "adhere", "descompensada"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "sca-sem-supra-st",
    categoryId: "cardiologia",
    name: "SCA sem Supra de ST",
    summary: "HEART Score, estratégia invasiva e checklist medicamentoso.",
    keywords: ["nstemi", "angina instável", "heart score"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },

  // Neurologia — Categoria C
  {
    id: "avc",
    categoryId: "neurologia",
    name: "AVC / AIT",
    summary: "Janela de reperfusão, PA, trombolíticos e trombectomia.",
    keywords: ["avc", "trombólise", "alteplase", "tenecteplase"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "crise-convulsiva",
    categoryId: "neurologia",
    name: "Crise Convulsiva",
    summary: "Status epilepticus em fases, cronômetro e doses por peso.",
    keywords: ["convulsão", "status", "midazolam"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "rebaixamento-consciencia",
    categoryId: "neurologia",
    name: "Rebaixamento de Consciência",
    summary: "Glasgow, reversíveis e naloxona com log de doses.",
    keywords: ["coma", "glasgow", "naloxona"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "meningite",
    categoryId: "neurologia",
    name: "Meningite / Encefalite",
    summary: "Antibioticoterapia empírica por faixa etária.",
    keywords: ["meningite", "ceftriaxona", "dexametasona"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },

  // Respiratório — Categoria C
  {
    id: "asma",
    categoryId: "respiratorio",
    name: "Dispneia Aguda / Asma",
    summary: "Gravidade da crise, broncodilatador, corticoide e MgSO₄.",
    keywords: ["asma", "salbutamol", "dispneia"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "tep",
    categoryId: "respiratorio",
    name: "Tromboembolismo Pulmonar",
    summary: "YEARS, sPESI, Hestia e categorias A–E / PERT.",
    keywords: ["tep", "years", "spesi", "pert"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "dpoc",
    categoryId: "respiratorio",
    name: "DPOC Exacerbado",
    summary: "Broncodilatadores, corticoide e suporte ventilatório.",
    keywords: ["dpoc", "ipratropio", "prednisona"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },

  // Metabólico — Categoria C
  {
    id: "cad",
    categoryId: "metabolico",
    name: "Cetoacidose Diabética",
    summary: "Gravidade, hidratação, insulina 0,1 UI/kg/h e potássio.",
    keywords: ["cad", "insulina", "potássio"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "glicemia",
    categoryId: "metabolico",
    name: "Hipo / Hiperglicemia",
    summary: "Emergências glicêmicas, anion gap, osmolaridade e histórico HGT.",
    keywords: ["hipoglicemia", "hiperglicemia", "ehh"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "disturbios-eletroliticos",
    categoryId: "metabolico",
    name: "Distúrbios Eletrolíticos",
    summary: "7 distúrbios, gravidade e Adrogué-Madias (Na/água livre).",
    keywords: ["potássio", "sódio", "cálcio", "magnésio"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },

  // Gastroenterologia — Categoria C
  {
    id: "abdome-agudo",
    categoryId: "gastroenterologia",
    name: "Abdome Agudo",
    summary: "Sinais cirúrgicos, imagem e condutas iniciais.",
    keywords: ["abdome", "peritonite", "cirurgia"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "hda",
    categoryId: "gastroenterologia",
    name: "Hemorragia Digestiva Alta",
    summary: "Glasgow-Blatchford, Rockall e conduta endoscópica.",
    keywords: ["hda", "gbs", "rockall", "ibp"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },

  // Obstetrícia — Categoria C
  {
    id: "emergencias-obstetricas",
    categoryId: "obstetricia",
    name: "Emergências Obstétricas",
    summary: "Pré-eclâmpsia/eclâmpsia (Zuspan) e HPP com uterotônicos.",
    keywords: ["eclâmpsia", "hpp", "magnésio", "tranexâmico"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },

  // Saúde Mental — Categoria D
  {
    id: "agitacao",
    categoryId: "saude-mental",
    name: "Agitação Psicomotora",
    summary: "RASS, desescalada vs contenção química (Baldacara 2019).",
    keywords: ["agitação", "haloperidol", "midazolam", "rass"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "risco-suicidio",
    categoryId: "saude-mental",
    name: "Risco de Suicídio",
    summary: "C-SSRS hierárquico e SAD PERSONS (0–10).",
    keywords: ["suicídio", "cssrs", "sad persons"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "abstinencia-alcoolica",
    categoryId: "saude-mental",
    name: "Abstinência Alcoólica / DT",
    summary: "CIWA-Ar, BZD symptom-triggered e tiamina.",
    keywords: ["ciwa", "delirium tremens", "benzodiazepínico"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "psicose-aguda",
    categoryId: "saude-mental",
    name: "Psicose Aguda",
    summary: "11 sinais orgânicos em 1º surto psicótico.",
    keywords: ["psicose", "orgânico", "primeiro surto"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "intoxicacao",
    categoryId: "saude-mental",
    name: "Intoxicação Exógena",
    summary: "Suporte ABCDE e antídotos específicos.",
    keywords: ["intoxicação", "carvão", "naloxona"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },
  {
    id: "crise-panico",
    categoryId: "saude-mental",
    name: "Crise de Pânico",
    summary: "Manejo não farmacológico e benzodiazepínicos.",
    keywords: ["pânico", "ansiedade", "lorazepam"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },

  // Manejo UTI / Sintomas — Categoria D
  {
    id: "delirium",
    categoryId: "manejo-uti",
    name: "Delirium / CAM-ICU",
    summary: "RASS completo, CAM-ICU e subtipo (PADIS 2018).",
    keywords: ["delirium", "cam-icu", "rass"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "dor-escada-analgesica",
    categoryId: "manejo-uti",
    name: "Dor — Escada Analgésica",
    summary: "EVA/NRS e degraus OMS cumulativos (adulto).",
    keywords: ["dor", "eva", "morfina", "tramadol"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "sedacao",
    categoryId: "manejo-uti",
    name: "Sedação em UTI",
    summary: "Sedação contínua e analgesia em ventilação mecânica.",
    keywords: ["sedação", "fentanil", "propofol"],
    hasDoseCalculator: true,
    hasInteractiveModule: true,
  },

  // Ferramentas transversais (7)
  {
    id: "calculadora-gotejamento",
    categoryId: "ferramentas",
    name: "Calculadora de Gotejamento",
    summary: "mL/h e gotas/min a partir de dose e diluição; 11 presets vasoativos.",
    keywords: ["gotejamento", "bomba", "infusão", "noradrenalina"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "funcao-renal",
    categoryId: "ferramentas",
    name: "Função Renal",
    summary: "Cockcroft-Gault e CKD-EPI 2021 com estadiamento KDIGO.",
    keywords: ["creatinina", "clearance", "tfg", "renal"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "interacao-medicamentosa",
    categoryId: "ferramentas",
    name: "Interação Medicamentosa",
    summary: "31 pares relevantes em emergência (lista curada).",
    keywords: ["interação", "varfarina", "qt"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "antibioticos",
    categoryId: "ferramentas",
    name: "Antibióticos",
    summary: "Doses, diluição e ajuste renal — 33 fármacos de referência.",
    keywords: ["antibiótico", "ceftriaxona", "vancomicina"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "gasometria",
    categoryId: "ferramentas",
    name: "Gasometria",
    summary: "Ácido-base, compensação, AG, delta ratio e P/F.",
    keywords: ["gasometria", "winter", "anion gap"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "assistente-ecg",
    categoryId: "ferramentas",
    name: "Assistente de Laudo ECG",
    summary: "Achados manuais, QTc e links aos protocolos relacionados.",
    keywords: ["ecg", "qtc", "laudo"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
  {
    id: "hub-escores",
    categoryId: "ferramentas",
    name: "Hub de Escores Rápidos",
    summary: "qSOFA, HEART, Wells TEP, Padua + atalhos CIWA/suicídio.",
    keywords: ["qsofa", "heart", "wells", "padua"],
    hasDoseCalculator: false,
    hasInteractiveModule: true,
  },
];

export function getProtocolById(id: string) {
  return CLINICAL_PROTOCOLS.find((protocol) => protocol.id === id);
}

export function getProtocolsByCategory(categoryId: string) {
  return CLINICAL_PROTOCOLS.filter(
    (protocol) => protocol.categoryId === categoryId
  );
}

export function searchProtocols(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return CLINICAL_PROTOCOLS;

  return CLINICAL_PROTOCOLS.filter((protocol) => {
    const haystack = [
      protocol.name,
      protocol.summary,
      ...protocol.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getCategoryProtocolCount(categoryId: string) {
  return getProtocolsByCategory(categoryId).length;
}
