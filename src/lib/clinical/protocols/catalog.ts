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
  },
  {
    id: "pcr-pediatria",
    categoryId: "emergencia",
    name: "PCR em Pediatria",
    summary: "RCP pediátrica com doses por peso.",
    keywords: ["parada", "pediatria", "adrenalina", "criança"],
    hasDoseCalculator: true,
  },
  {
    id: "anafilaxia",
    categoryId: "emergencia",
    name: "Anafilaxia",
    summary: "Adrenalina IM e medidas de suporte imediato.",
    keywords: ["alergia", "urticária", "broncoespasmo", "adrenalina"],
    hasDoseCalculator: true,
  },
  {
    id: "isr",
    categoryId: "emergencia",
    name: "Intubação de Sequência Rápida",
    summary: "Pré-medicação, indução e bloqueio neuromuscular.",
    keywords: ["intubação", "etomidato", "succinilcolina", "rocurônio"],
    hasDoseCalculator: true,
  },
  {
    id: "status-epilepticus",
    categoryId: "emergencia",
    name: "Status Epilepticus",
    summary: "Controle de convulsão prolongada ou recorrente.",
    keywords: ["convulsão", "midazolam", "fenitoína", "diazepam"],
    hasDoseCalculator: true,
  },
  {
    id: "bradicardia",
    categoryId: "emergencia",
    name: "Bradicardia Sintomática",
    summary: "Atropina e marcapasso conforme estabilidade.",
    keywords: ["bradicardia", "atropina", "marcapasso"],
    hasDoseCalculator: true,
  },
  {
    id: "taquicardia-instavel",
    categoryId: "emergencia",
    name: "Taquicardia Instável",
    summary: "Cardioversão e antiarrítmicos de urgência.",
    keywords: ["taquicardia", "cardioversão", "amiodarona"],
    hasDoseCalculator: true,
  },
  {
    id: "choque-hemorragico",
    categoryId: "emergencia",
    name: "Choque Hemorrágico",
    summary: "Reposição volêmica e hemoderivados.",
    keywords: ["hemorragia", "choque", "cristaloides", "sangue"],
    hasDoseCalculator: true,
  },
  {
    id: "rebaixamento-consciencia",
    categoryId: "emergencia",
    name: "Rebaixamento de Consciência",
    summary: "ABCDE, glicemia e antídotos específicos.",
    keywords: ["coma", "glasgow", "glicemia", "naloxona"],
    hasDoseCalculator: true,
  },
  {
    id: "crise-hipertensiva",
    categoryId: "emergencia",
    name: "Crise Hipertensiva",
    summary: "Controle pressórico em emergência com lesão de órgão-alvo.",
    keywords: ["hipertensão", "enalaprilato", "nitroprussiato"],
    hasDoseCalculator: false,
  },

  // Cardiologia (7)
  {
    id: "sca",
    categoryId: "cardiologia",
    name: "Síndrome Coronariana Aguda",
    summary: "AAS, anticoagulação e estratificação de risco.",
    keywords: ["iam", "sca", "aas", "clopidogrel"],
    hasDoseCalculator: true,
  },
  {
    id: "edema-pulmao",
    categoryId: "cardiologia",
    name: "Edema Agudo de Pulmão",
    summary: "Diuréticos, vasodilatadores e suporte ventilatório.",
    keywords: ["eap", "furosemida", "nitroglicerina"],
    hasDoseCalculator: true,
  },
  {
    id: "fibrilacao-atrial",
    categoryId: "cardiologia",
    name: "Fibrilação Atrial",
    summary: "Controle de frequência e anticoagulação.",
    keywords: ["fa", "amiodarona", "metoprolol"],
    hasDoseCalculator: false,
  },
  {
    id: "flutter-atrial",
    categoryId: "cardiologia",
    name: "Flutter Atrial",
    summary: "Cardioversão e controle de ritmo.",
    keywords: ["flutter", "cardioversão"],
    hasDoseCalculator: false,
  },
  {
    id: "sincope",
    categoryId: "cardiologia",
    name: "Síncope",
    summary: "Avaliação de risco e monitorização.",
    keywords: ["síncope", "desmaio"],
    hasDoseCalculator: false,
  },
  {
    id: "pericardite",
    categoryId: "cardiologia",
    name: "Pericardite Aguda",
    summary: "Anti-inflamatórios e investigação etiológica.",
    keywords: ["pericardite", "ibuprofeno", "colchicina"],
    hasDoseCalculator: true,
  },
  {
    id: "taquicardia-ventricular",
    categoryId: "cardiologia",
    name: "Taquicardia Ventricular",
    summary: "Amiodarona, lidocaína e cardioversão.",
    keywords: ["tv", "amiodarona", "lidocaína"],
    hasDoseCalculator: true,
  },

  // Neurologia (3)
  {
    id: "avc-isquemico",
    categoryId: "neurologia",
    name: "AVC Isquêmico",
    summary: "Trombólise, anticoagulação e metas pressóricas.",
    keywords: ["avc", "trombólise", "alteplase"],
    hasDoseCalculator: true,
  },
  {
    id: "avc-hemorragico",
    categoryId: "neurologia",
    name: "AVC Hemorrágico / HSA",
    summary: "Controle pressórico e reversão anticoagulante.",
    keywords: ["hémorragia", "hsa", "pressão"],
    hasDoseCalculator: false,
  },
  {
    id: "meningite",
    categoryId: "neurologia",
    name: "Meningite / Encefalite",
    summary: "Antibioticoterapia empírica por faixa etária.",
    keywords: ["meningite", "ceftriaxona", "dexametasona"],
    hasDoseCalculator: true,
  },

  // Respiratório (2)
  {
    id: "asma",
    categoryId: "respiratorio",
    name: "Asma Aguda Grave",
    summary: "Beta-2 agonista, corticoide e sulfato de magnésio.",
    keywords: ["asma", "salbutamol", "prednisolona"],
    hasDoseCalculator: true,
  },
  {
    id: "dpoc",
    categoryId: "respiratorio",
    name: "DPOC Exacerbado",
    summary: "Broncodilatadores, corticoide e suporte ventilatório.",
    keywords: ["dpoc", "ipratropio", "prednisona"],
    hasDoseCalculator: true,
  },

  // Metabólico (3)
  {
    id: "cad",
    categoryId: "metabolico",
    name: "Cetoacidose Diabética",
    summary: "Hidratação, insulina e correção eletrolítica.",
    keywords: ["cad", "insulina", "potássio"],
    hasDoseCalculator: true,
  },
  {
    id: "hipoglicemia",
    categoryId: "metabolico",
    name: "Hipoglicemia",
    summary: "Glicose EV e glucagon conforme via e idade.",
    keywords: ["hipoglicemia", "glicose", "glucagon"],
    hasDoseCalculator: true,
  },
  {
    id: "hipercalemia",
    categoryId: "metabolico",
    name: "Hipercalemia",
    summary: "Estabilização de membrana e eliminação de potássio.",
    keywords: ["potássio", "gluconato de cálcio", "insulina"],
    hasDoseCalculator: true,
  },

  // Gastroenterologia (1)
  {
    id: "hda",
    categoryId: "gastroenterologia",
    name: "Hemorragia Digestiva Alta",
    summary: "Reposição, IBP e estratificação endoscópica.",
    keywords: ["hda", "omeprazol", "sangramento"],
    hasDoseCalculator: true,
  },

  // Obstetrícia (1)
  {
    id: "eclampsia",
    categoryId: "obstetricia",
    name: "Pré-eclâmpsia / Eclâmpsia",
    summary: "Sulfato de magnésio e controle pressórico.",
    keywords: ["eclâmpsia", "magnésio", "hipertensão gestacional"],
    hasDoseCalculator: true,
  },

  // Saúde Mental (4)
  {
    id: "agitacao",
    categoryId: "saude-mental",
    name: "Agitação Psicomotora",
    summary: "Contenção verbal, farmacológica e de suporte.",
    keywords: ["agitação", "haloperidol", "midazolam"],
    hasDoseCalculator: true,
  },
  {
    id: "intoxicacao",
    categoryId: "saude-mental",
    name: "Intoxicação Exógena",
    summary: "Suporte ABCDE e antídotos específicos.",
    keywords: ["intoxicação", "carvão", "naloxona"],
    hasDoseCalculator: true,
  },
  {
    id: "crise-panico",
    categoryId: "saude-mental",
    name: "Crise de Pânico",
    summary: "Manejo não farmacológico e benzodiazepínicos.",
    keywords: ["pânico", "ansiedade", "lorazepam"],
    hasDoseCalculator: true,
  },
  {
    id: "overdose",
    categoryId: "saude-mental",
    name: "Overdose / Tentativa de Suicídio",
    summary: "Estabilização, descontaminação e antídotos.",
    keywords: ["overdose", "suicídio", "antídoto"],
    hasDoseCalculator: true,
  },

  // Manejo UTI (2)
  {
    id: "sedacao",
    categoryId: "manejo-uti",
    name: "Sedação em UTI",
    summary: "Sedação contínua e analgesia em ventilação mecânica.",
    keywords: ["sedação", "fentanil", "propofol"],
    hasDoseCalculator: true,
  },
  {
    id: "delirium",
    categoryId: "manejo-uti",
    name: "Delirium Agitado",
    summary: "Medidas não farmacológicas e antipsicóticos.",
    keywords: ["delirium", "haloperidol", "dexmedetomidina"],
    hasDoseCalculator: true,
  },

  // Ferramentas (6)
  {
    id: "glasgow",
    categoryId: "ferramentas",
    name: "Escala de Glasgow",
    summary: "Avaliação do nível de consciência.",
    keywords: ["glasgow", "consciência", "escala"],
    hasDoseCalculator: false,
  },
  {
    id: "wells",
    categoryId: "ferramentas",
    name: "Score de Wells (TEP)",
    summary: "Probabilidade clínica de tromboembolismo pulmonar.",
    keywords: ["wells", "tep", "tromboembolismo"],
    hasDoseCalculator: false,
  },
  {
    id: "curb65",
    categoryId: "ferramentas",
    name: "CURB-65",
    summary: "Gravidade de pneumonia adquirida na comunidade.",
    keywords: ["curb", "pneumonia", "escore"],
    hasDoseCalculator: false,
  },
  {
    id: "parkland",
    categoryId: "ferramentas",
    name: "Fórmula de Parkland",
    summary: "Reposição volêmica em queimaduras extensas.",
    keywords: ["parkland", "queimadura", "volume"],
    hasDoseCalculator: true,
  },
  {
    id: "sodio",
    categoryId: "ferramentas",
    name: "Correção de Sódio",
    summary: "Taxa segura de correção de hiponatremia.",
    keywords: ["sódio", "hiponatremia", "correção"],
    hasDoseCalculator: false,
  },
  {
    id: "creatinina",
    categoryId: "ferramentas",
    name: "Clearance de Creatinina",
    summary: "Estimativa de função renal (Cockcroft-Gault).",
    keywords: ["creatinina", "renal", "cockcroft"],
    hasDoseCalculator: false,
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
