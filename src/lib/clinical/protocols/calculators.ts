import type { PatientParams, ProtocolResult } from "./types";
import {
  AGE_GROUP_LABELS,
  doseLine,
  formatMg,
  formatMl,
  getAgeGroup,
  isPediatric,
  weightBasedDose,
} from "./dose-utils";

type CalculatorFn = (params: PatientParams) => ProtocolResult;

function baseResult(
  params: PatientParams,
  steps: ProtocolResult["steps"],
  doses: ProtocolResult["doses"],
  warnings: string[] = []
): ProtocolResult {
  const ageGroup = getAgeGroup(params);
  return {
    ageGroup,
    ageGroupLabel: AGE_GROUP_LABELS[ageGroup],
    steps,
    doses,
    warnings,
    references: [
      "Doses calculadas com base em referências assistenciais usuais. Confirmar apresentação, diluição e contraindicações antes da prescrição.",
    ],
  };
}

const calculatePcrAdulto: CalculatorFn = (params) => {
  const { weightKg } = params;
  const doses = [
    doseLine("Adrenalina", "1 mg", "EV", {
      frequency: "A cada 3–5 min durante PCR",
      notes: "Dose fixa em adulto (10 mL de solução 1:10.000).",
    }),
    doseLine(
      "Amiodarona",
      params.weightKg >= 40 ? "300 mg" : formatMg(weightBasedDose(weightKg, 5, 300)),
      "EV",
      {
        frequency: "1ª dose; repetir 150 mg se necessário",
        notes: "Após 3º choque em ritmo chocável.",
      }
    ),
    doseLine("Atropina", "Não indicada de rotina", "EV", {
      notes: "Removida das diretrizes de PCR em adulto.",
    }),
  ];

  return baseResult(
    params,
    [
      {
        title: "Sequência imediata",
        items: [
          "Confirmar PCR, chamar ajuda e iniciar compressões (100–120/min).",
          "Ventilar com bolsa-válvula-máscara ou dispositivo avançado.",
          "Monitorizar e aplicar desfibrilação se ritmo chocável.",
          "Obter acesso venoso/periférico ou intraósseo.",
        ],
      },
    ],
    doses
  );
};

const calculatePcrPediatria: CalculatorFn = (params) => {
  const { weightKg } = params;
  const adrenalinaMg = weightBasedDose(weightKg, 0.01, 1);
  const amiodaronaMg = weightBasedDose(weightKg, 5, 300);

  return baseResult(
    params,
    [
      {
        title: "RCP pediátrica",
        items: [
          "Compressões e ventilações na proporção 15:2 (2 socorristas) ou 30:2.",
          "Choque inicial 2 J/kg; doses subsequentes 4 J/kg (máx. 10 J/kg).",
          "Reavaliar ritmo a cada 2 minutos.",
        ],
      },
    ],
    [
      doseLine("Adrenalina", formatMg(adrenalinaMg), "EV/IO", {
        frequency: "A cada 3–5 min",
        notes: "0,01 mg/kg (0,1 mL/kg de 1:10.000).",
      }),
      doseLine("Amiodarona", formatMg(amiodaronaMg), "EV/IO", {
        frequency: "1ª dose; repetir metade se necessário",
        notes: "5 mg/kg.",
      }),
      doseLine("Atropina", formatMg(weightBasedDose(weightKg, 0.02, 0.5)), "EV/IO", {
        notes: "0,02 mg/kg — considerar bradicardia sintomática.",
      }),
    ],
    ["Usar cálculo por peso real ou peso estimado por idade se desconhecido."]
  );
};

const calculateAnafilaxia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const adrenalineMg = isAdult
    ? Math.min(weightBasedDose(weightKg, 0.01, 0.5), 0.5)
    : weightBasedDose(weightKg, 0.01, 0.3);

  return baseResult(
    params,
    [
      {
        title: "Medidas imediatas",
        items: [
          "Interromper exposição ao alérgeno.",
          "Monitorizar SpO₂, PA e FR.",
          "Posicionar paciente (decúbito dorsal; elevar MMII se hipotensão).",
          "Repetir adrenalina IM a cada 5–15 min se persistência.",
        ],
      },
    ],
    [
      doseLine("Adrenalina", formatMg(adrenalineMg), "IM", {
        frequency: "Repetir a cada 5–15 min se necessário",
        notes: isAdult
          ? "0,01 mg/kg (máx. 0,5 mg) — face lateral da coxa."
          : "0,01 mg/kg (máx. 0,3 mg em pediatria).",
      }),
      doseLine(
        "SF 0,9%",
        isPediatric(getAgeGroup(params))
          ? formatMl(weightKg * 20)
          : "500–1000 mL",
        "EV",
        {
          frequency: "Bolus; reavaliar perfusão",
          notes: "Expansão volêmica se hipotensão.",
        }
      ),
      doseLine("Hidrocortisona", isAdult ? "200 mg" : formatMg(weightBasedDose(weightKg, 4, 200)), "EV", {
        notes: "Considerar se broncoespasmo ou urticária persistente.",
      }),
    ]
  );
};

const calculateIsr: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isChild = isPediatric(ageGroup);

  const etomidateMg = isChild
    ? weightBasedDose(weightKg, 0.3, 20)
    : weightKg < 40
      ? weightBasedDose(weightKg, 0.3, 20)
      : 20;

  const rocuroniumMg = weightBasedDose(weightKg, 1.2, 100);
  const succinylcholineMg = weightBasedDose(weightKg, 1.5, 150);
  const fentanylMcg = weightBasedDose(weightKg, 2, 200);
  const midazolamMg = weightBasedDose(weightKg, 0.05, 5);

  return baseResult(
    params,
    [
      {
        title: "Preparação ISR",
        items: [
          "Pré-oxigenar por 3–5 min se possível.",
          "Posicionar paciente e preparar material de via aérea difícil.",
          "Monitorizar ECG, SpO₂ e capnografia.",
          "Confirmar disponibilidade de dispositivo de resgate (bougie, máscara laríngea).",
        ],
      },
    ],
    [
      doseLine("Fentanil", `${fentanylMcg} mcg`, "EV", {
        notes: "Pré-medicação analgésica (1–2 mcg/kg).",
      }),
      doseLine("Midazolam", formatMg(midazolamMg), "EV", {
        notes: "Pré-medicação sedativa (0,05 mg/kg).",
      }),
      doseLine("Etomidato", formatMg(etomidateMg), "EV", {
        notes: isChild ? "0,3 mg/kg" : "0,3 mg/kg (máx. 20 mg).",
      }),
      doseLine("Succinilcolina", formatMg(succinylcholineMg), "EV", {
        notes: "1–1,5 mg/kg — alternativa: Rocurônio.",
      }),
      doseLine("Rocurônio", formatMg(rocuroniumMg), "EV", {
        notes: "1,2 mg/kg se contraindicação a succinilcolina.",
      }),
    ],
    ["Evitar etomidato em choque séptico grave se houver alternativa."]
  );
};

const calculateStatusEpilepticus: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  const midazolamImMg = weightBasedDose(weightKg, 0.2, 10);
  const midazolamEvMg = weightBasedDose(weightKg, 0.1, 4);
  const diazepamMg = isAdult ? 10 : weightBasedDose(weightKg, 0.2, 10);
  const fenitoinaMg = weightBasedDose(weightKg, 20, 1500);

  return baseResult(
    params,
    [
      {
        title: "Linha do tempo",
        items: [
          "0–5 min: estabilizar, glicemia capilar, O₂.",
          "5–20 min: benzodiazepínico (1ª linha).",
          "20–40 min: 2º benzodiazepínico ou fármaco anti-epiléptico.",
          "≥ 40 min: status refratário — UTI e EEG.",
        ],
      },
    ],
    [
      doseLine("Midazolam", formatMg(midazolamImMg), "IM", {
        notes: "0,2 mg/kg — preferível se sem acesso venoso.",
      }),
      doseLine("Midazolam", formatMg(midazolamEvMg), "EV", {
        notes: "0,1 mg/kg — repetir em 5 min se necessário.",
      }),
      doseLine("Diazepam", formatMg(diazepamMg), "EV", {
        notes: isAdult ? "5–10 mg EV lento" : "0,2 mg/kg.",
      }),
      doseLine("Fenitoína", formatMg(fenitoinaMg), "EV", {
        notes: "20 mg/kg em 50 mL SF (máx. 1500 mg) — infundir ≤ 50 mg/min.",
      }),
    ]
  );
};

const calculateBradicardia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const atropineMg = weightBasedDose(weightKg, 0.02, 1);

  return baseResult(
    params,
    [
      {
        title: "Manejo",
        items: [
          "Avaliar instabilidade (hipotensão, rebaixamento, dor torácica).",
          "Atropina se bradicardia sintomática.",
          "Considerar marcapasso transcutâneo/transvenoso se refratária.",
          "Tratar causa reversível (hipoxia, isquemia, fármacos).",
        ],
      },
    ],
    [
      doseLine("Atropina", formatMg(atropineMg), "EV", {
        frequency: "Repetir a cada 3–5 min",
        notes: "0,02 mg/kg (mín. 0,1 mg; máx. 0,5 mg ped / 1 mg adulto).",
      }),
      doseLine("Adrenalina", formatMg(weightBasedDose(weightKg, 0.01, 1)), "EV/IO", {
        notes: "Se atropina ineficaz — infusão contínua pode ser necessária.",
      }),
    ]
  );
};

const calculateTaquicardiaInstavel: CalculatorFn = (params) => {
  const { weightKg } = params;
  const amiodaroneMg = weightBasedDose(weightKg, 5, 300);

  return baseResult(
    params,
    [
      {
        title: "Taquicardia instável",
        items: [
          "Sedação se consciente e cardioversão sincronizada imediata.",
          "Energia inicial: 120–200 J bifásico (adulto) ou 0,5–1 J/kg (ped).",
          "Se ritmo regular e QRS largo: amiodarona EV.",
        ],
      },
    ],
    [
      doseLine("Amiodarona", formatMg(amiodaroneMg), "EV", {
        notes: "5 mg/kg em 20–60 min; repetir metade se necessário.",
      }),
      doseLine("Adenosina", getAgeGroup(params) === "adulto" ? "6 mg → 12 mg" : formatMg(weightBasedDose(weightKg, 0.1, 6)), "EV", {
        notes: "Considerar se TSV de QRS estreito estável.",
      }),
    ]
  );
};

const calculateChoqueHemorragico: CalculatorFn = (params) => {
  const { weightKg } = params;
  const bolusMl = weightKg * 20;

  return baseResult(
    params,
    [
      {
        title: "Controle de hemorragia",
        items: [
          "Compressão direta e controle definitivo da fonte.",
          "2 acessos calibrosos, aquecer paciente.",
          "Protocolo de transfusão maciça se choque grau III/IV.",
          "Ácido tranexâmico precoce se indicado.",
        ],
      },
    ],
    [
      doseLine("SF 0,9% / Ringer Lactato", formatMl(bolusMl), "EV", {
        frequency: "Bolus — reavaliar perfusão",
        notes: "20 mL/kg — repetir conforme resposta.",
      }),
      doseLine("Ácido tranexâmico", weightKg >= 30 ? "1 g" : formatMg(weightBasedDose(weightKg, 15, 1000)), "EV", {
        notes: "1 g em 10 min; considerar 2ª dose em 8 h.",
      }),
    ]
  );
};

const calculateRebaixamentoConsciencia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "ABCDE + causa reversível",
        items: [
          "Glicemia capilar imediata.",
          "O₂ suplementar e monitorização contínua.",
          "Investigar intoxicação, trauma, AVC, infecção.",
          "Considerar TC de crânio se indicado.",
        ],
      },
    ],
    [
      doseLine(
        "Glicose 50%",
        isAdult ? "25–50 mL" : formatMl(weightKg * 0.5),
        "EV",
        {
          notes: isAdult
            ? "Se hipoglicemia — equivalente a 0,5–1 g/kg."
            : "2–4 mL/kg de glicose 25%.",
        }
      ),
      doseLine("Naloxona", isAdult ? "0,4–2 mg" : formatMg(weightBasedDose(weightKg, 0.1, 2)), "EV/IM/IN", {
        frequency: "Repetir a cada 2–3 min",
        notes: "Se suspeita de overdose de opioide.",
      }),
      doseLine("Tiamina", isAdult ? "200 mg" : formatMg(weightBasedDose(weightKg, 10, 200)), "EV", {
        notes: "Antes ou junto com glicose se risco de Wernicke.",
      }),
    ]
  );
};

const calculateSca: CalculatorFn = (params) => {
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "SCA sem supra",
        items: [
          "AAS 300 mg mastigável + P2Y12 de carga.",
          "Anticoagulação conforme estratificação.",
          "ECG seriado e troponina.",
          "Considerar cateterismo precoce se alto risco.",
        ],
      },
    ],
    [
      doseLine("AAS", "300 mg", "VO", { notes: "Dose de ataque." }),
      doseLine("Clopidogrel", isAdult ? "300 mg" : formatMg(weightBasedDose(params.weightKg, 2, 300)), "VO", {
        notes: "Alternativas: ticagrelor ou prasugrel conforme protocolo.",
      }),
      doseLine("Enoxaparina", isAdult ? "1 mg/kg" : formatMg(weightBasedDose(params.weightKg, 1)), "SC", {
        frequency: "12/12 h",
        notes: "Ajustar se ClCr < 30 mL/min.",
      }),
    ]
  );
};

const calculateEdemaPulmao: CalculatorFn = (params) => {
  const { weightKg } = params;
  const furosemideMg = weightBasedDose(weightKg, 1, 80);

  return baseResult(
    params,
    [
      {
        title: "EAP cardiogênico",
        items: [
          "Posição sentada, O₂ e CPAP/VNI se SpO₂ baixa.",
          "Monitorizar diurese e perfusão.",
          "Investigar descompensação e gatilho.",
        ],
      },
    ],
    [
      doseLine("Furosemida", formatMg(furosemideMg), "EV", {
        notes: "0,5–1 mg/kg — repetir conforme diurese.",
      }),
      doseLine("Nitroglicerina", "0,4 mg", "SL", {
        frequency: "A cada 5 min",
        notes: "Se PAS > 90 mmHg — preferir spray SL.",
      }),
      doseLine("Morfina", formatMg(weightBasedDose(weightKg, 0.05, 5)), "EV", {
        notes: "2–4 mg adulto — usar com cautela (risco respiratório).",
      }),
    ]
  );
};

const calculatePericardite: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [],
    [
      doseLine("Ibuprofeno", isAdult ? "600 mg" : formatMg(weightBasedDose(weightKg, 10, 600)), "VO", {
        frequency: "8/8 h",
      }),
      doseLine("Colchicina", isAdult ? "0,5 mg" : formatMg(weightBasedDose(weightKg, 0.05, 0.5)), "VO", {
        frequency: "12/12 h",
      }),
    ]
  );
};

const calculateTaquicardiaVentricular: CalculatorFn = (params) => {
  const { weightKg } = params;
  const amiodaroneMg = weightBasedDose(weightKg, 5, 300);
  const lidocaineMg = weightBasedDose(weightKg, 1, 100);

  return baseResult(
    params,
    [
      {
        title: "TV com pulso",
        items: [
          "Cardioversão sincronizada se instável.",
          "Amiodarona EV se estável.",
          "Corrigir distúrbios eletrolíticos.",
        ],
      },
    ],
    [
      doseLine("Amiodarona", formatMg(amiodaroneMg), "EV", {
        notes: "150 mg em 10 min (adulto) ou 5 mg/kg ped.",
      }),
      doseLine("Lidocaína", formatMg(lidocaineMg), "EV", {
        notes: "1–1,5 mg/kg — alternativa se amiodarona indisponível.",
      }),
    ]
  );
};

const calculateAvcIsquemico: CalculatorFn = (params) => {
  const { weightKg } = params;
  const alteplaseMg = Math.min(weightBasedDose(weightKg, 0.9, 90), 90);

  return baseResult(
    params,
    [
      {
        title: "AVC isquêmico agudo",
        items: [
          "Confirmar elegibilidade para trombólise (< 4,5 h).",
          "PA < 185/110 mmHg antes da trombólise.",
          "TC de crânio sem hemorragia.",
        ],
      },
    ],
    [
      doseLine("Alteplase (rtPA)", formatMg(alteplaseMg * 0.1), "EV bolus", {
        notes: "10% em bolus — restante em 60 min (0,9 mg/kg, máx. 90 mg).",
      }),
      doseLine("Alteplase (rtPA)", formatMg(alteplaseMg * 0.9), "EV infusão", {
        notes: "90% em 60 minutos.",
      }),
    ],
    ["Contraindicações absolutas e relativas devem ser revisadas antes da trombólise."]
  );
};

const calculateMeningite: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "Antibioticoterapia empírica",
        items: [
          "Coletar hemocultura e LCR antes dos antibióticos se possível.",
          "Dexametasona antes ou com 1ª dose ATB se meningite bacteriana.",
        ],
      },
    ],
    [
      doseLine("Ceftriaxona", isAdult ? "2 g" : formatMg(weightBasedDose(weightKg, 100, 2000)), "EV", {
        frequency: "12/12 h",
      }),
      doseLine("Dexametasona", formatMg(weightBasedDose(weightKg, 0.15, 10)), "EV", {
        frequency: "6/6 h por 4 dias",
        notes: "0,15 mg/kg — iniciar antes da 1ª dose de ATB.",
      }),
      doseLine("Vancomicina", formatMg(weightBasedDose(weightKg, 15, 2000)), "EV", {
        frequency: "12/12 h",
        notes: "Adicionar se suspeita de pneumococo resistente.",
      }),
    ]
  );
};

const calculateAsma: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const salbutamolPuffs = isAdult ? "4–8 jatos" : `${Math.min(Math.ceil(weightKg / 5) * 2, 8)} jatos`;
  const prednisoloneMg = isAdult ? "40–60 mg" : formatMg(weightBasedDose(weightKg, 1, 60));
  const magnesiumMg = weightBasedDose(weightKg, 50, 2000);

  return baseResult(
    params,
    [
      {
        title: "Asma aguda grave",
        items: [
          "Salbutamol inalatório repetido + O₂ para SpO₂ > 94%.",
          "Brometo de ipratrópio nas primeiras horas.",
          "Corticoide sistêmico precoce.",
        ],
      },
    ],
    [
      doseLine("Salbutamol", salbutamolPuffs, "Inalatório", {
        frequency: "A cada 20 min na 1ª hora",
        notes: "100 mcg/jato via nebulização ou MDI com espaçador.",
      }),
      doseLine("Prednisolona", prednisoloneMg, "VO", {
        notes: isAdult ? "40–60 mg/dia" : "1 mg/kg/dia (máx. 60 mg).",
      }),
      doseLine("Sulfato de magnésio", formatMg(magnesiumMg), "EV", {
        notes: "50 mg/kg em 20 min (máx. 2 g) se refratária.",
      }),
    ]
  );
};

const calculateDpoc: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "Exacerbação aguda",
        items: [
          "Salbutamol + ipratrópio repetidos na 1ª hora.",
          "Corticoide sistêmico 5 dias.",
          "Antibiótico se infecção bacteriana suspeita.",
          "VNI se acidose respiratória sem indicação imediata de IOT.",
        ],
      },
    ],
    [
      doseLine("Salbutamol", "2,5–5 mg", "Nebulização", {
        frequency: "A cada 20 min",
      }),
      doseLine("Ipratrópio", "0,5 mg", "Nebulização", {
        frequency: "6/6 h",
      }),
      doseLine("Prednisona", isAdult ? "40 mg" : formatMg(weightBasedDose(weightKg, 1, 40)), "VO", {
        frequency: "1x/dia por 5 dias",
      }),
    ]
  );
};

const calculateCad: CalculatorFn = (params) => {
  const { weightKg } = params;
  const bolusMl = weightKg * 20;
  const insulinUh = weightBasedDose(weightKg, 0.1, 10);

  return baseResult(
    params,
    [
      {
        title: "CAD",
        items: [
          "Hidratação SF 0,9% 15–20 mL/kg na 1ª hora.",
          "Insulina regular EV após potássio ≥ 3,3 mEq/L.",
          "Monitorizar K+, glicemia horária e gasometria.",
        ],
      },
    ],
    [
      doseLine("SF 0,9%", formatMl(bolusMl), "EV", {
        notes: "15–20 mL/kg na 1ª hora.",
      }),
      doseLine("Insulina regular", `${roundInsulin(insulinUh)} UI/h`, "EV infusão", {
        notes: "0,1 UI/kg/h — sem bolus se protocolo conservador.",
      }),
      doseLine("KCl", "Conforme K+ sérico", "EV", {
        notes: "Repor K+ antes/durante insulina conforme níveis.",
      }),
    ]
  );
};

function roundInsulin(value: number): number {
  return Math.round(value * 10) / 10;
}

const calculateHipoglicemia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const glucoseG = weightBasedDose(weightKg, 0.5, 50);

  return baseResult(
    params,
    [
      {
        title: "Hipoglicemia sintomática",
        items: [
          "Se consciente: glicose oral 15–20 g.",
          "Se inconsciente ou IV: glicose EV imediata.",
          "Investigar causa e ajustar medicações.",
        ],
      },
    ],
    [
      doseLine(
        "Glicose 50%",
        isAdult ? "25–50 mL" : formatMl(weightKg * 0.5),
        "EV",
        {
          notes: `${formatMg(glucoseG * 1000)} equivalente (~0,5 g/kg).`,
        }
      ),
      doseLine("Glucagon", isAdult ? "1 mg" : formatMg(weightBasedDose(weightKg, 0.03, 1)), "IM/SC", {
        notes: "Se sem acesso venoso — menos eficaz em hepatopatia.",
      }),
    ]
  );
};

const calculateHipercalemia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const calciumMl = isAdult ? "10 mL" : formatMl(weightKg * 0.7);
  const insulinUh = isAdult ? 10 : weightBasedDose(weightKg, 0.1, 10);
  const glucoseG = isAdult ? 25 : weightBasedDose(weightKg, 0.5, 25);

  return baseResult(
    params,
    [
      {
        title: "Hipercalemia com alteração ECG",
        items: [
          "Monitor cardíaco contínuo.",
          "Gluconato de cálcio se ondas T altas / QRS alargado.",
          "Insulina + glicose e/ou beta-2 agonista.",
        ],
      },
    ],
    [
      doseLine("Gluconato de cálcio 10%", calciumMl, "EV", {
        notes: "Em 2–5 min — não reduz K+, estabiliza membrana.",
      }),
      doseLine("Insulina regular", `${roundInsulin(insulinUh)} UI`, "EV", {
        notes: "Com glicose — shift intracelular.",
      }),
      doseLine("Glicose 50%", isAdult ? "25 g (50 mL)" : formatMl(weightKg * 0.5), "EV", {
        notes: "Acompanhar glicemia capilar por 4–6 h.",
      }),
    ]
  );
};

const calculateHda: CalculatorFn = (params) => {
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "HDA",
        items: [
          "Reposição volêmica e reserva de sangue.",
          "IBP EV precoce.",
          "Endoscopia digestiva alta em 24 h (ou urgente se instável).",
        ],
      },
    ],
    [
      doseLine("Omeprazol", isAdult ? "80 mg" : formatMg(weightBasedDose(params.weightKg, 1, 80)), "EV bolus", {
        notes: "Seguido de 8 mg/h infusão por 72 h se alto risco.",
      }),
      doseLine("SF 0,9%", formatMl(params.weightKg * 20), "EV", {
        notes: "Bolus 20 mL/kg se hipotensão.",
      }),
    ]
  );
};

const calculateEclampsia: CalculatorFn = (params) => {
  const { weightKg } = params;
  const loadingMg = weightBasedDose(weightKg, 60, 6000);
  const maintenanceMg = weightBasedDose(weightKg, 1, 2000);

  return baseResult(
    params,
    [
      {
        title: "Eclâmpsia / pré-eclâmpsia grave",
        items: [
          "Sulfato de magnésio — profilaxia e tratamento de convulsão.",
          "Controle pressórico (labetalol, hidralazina).",
          "Avaliar necessidade de resolução da gestação.",
        ],
      },
    ],
    [
      doseLine("Sulfato de magnésio", formatMg(loadingMg), "EV", {
        notes: "4–6 g em 15–20 min (≈ 40–60 mg/kg).",
      }),
      doseLine("Sulfato de magnésio", `${formatMg(maintenanceMg)}/24h`, "EV infusão", {
        notes: "1–2 g/h de manutenção — monitorizar reflexos e FR.",
      }),
      doseLine("Hidralazina", "5 mg", "EV", {
        frequency: "Repetir a cada 20 min",
        notes: "Controle pressórico — alternativa: labetalol.",
      }),
    ],
    ["Monitorizar reflexo patelar, FR e diurese durante sulfato de magnésio."]
  );
};

const calculateAgitacao: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const haloperidolMg = isAdult ? 5 : weightBasedDose(weightKg, 0.05, 5);
  const midazolamMg = weightBasedDose(weightKg, 0.05, 5);

  return baseResult(
    params,
    [
      {
        title: "Abordagem escalonada",
        items: [
          "Contenção verbal e ambiente calmo.",
          "Excluir causa orgânica (hipoxia, hipoglicemia, TCE).",
          "Farmacoterapia se risco iminente.",
        ],
      },
    ],
    [
      doseLine("Haloperidol", formatMg(haloperidolMg), "IM/EV", {
        notes: isAdult ? "2,5–5 mg" : "0,05 mg/kg.",
      }),
      doseLine("Midazolam", formatMg(midazolamMg), "IM/EV", {
        notes: "0,05 mg/kg — alternativa ou associação.",
      }),
      doseLine("Lorazepam", isAdult ? "2 mg" : formatMg(weightBasedDose(weightKg, 0.05, 2)), "IM/EV", {
        notes: "Alternativa benzodiazepínica.",
      }),
    ]
  );
};

const calculateIntoxicacao: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const charcoalG = weightBasedDose(weightKg, 1, 50);

  return baseResult(
    params,
    [
      {
        title: "Intoxicação aguda",
        items: [
          "ABCDE e antídoto específico se disponível.",
          "Carvão ativado se ingestão recente e via segura.",
          "Contato com centro de toxicologia.",
        ],
      },
    ],
    [
      doseLine("Carvão ativado", `${charcoalG} g`, "VO/SNG", {
        notes: "1 g/kg (máx. 50 g) se ingestão < 1–2 h.",
      }),
      doseLine("Naloxona", isAdult ? "0,4–2 mg" : formatMg(weightBasedDose(weightKg, 0.1, 2)), "EV/IN", {
        notes: "Opioides — titular até respiração espontânea.",
      }),
      doseLine("Flumazenil", isAdult ? "0,2 mg" : formatMg(weightBasedDose(weightKg, 0.01, 0.2)), "EV", {
        notes: "Benzodiazepínicos — cautela se epilepsia ou TCAs.",
      }),
    ]
  );
};

const calculateCrisePanico: CalculatorFn = (params) => {
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";

  return baseResult(
    params,
    [
      {
        title: "Crise aguda",
        items: [
          "Excluir causa orgânica (SCA, TEP, hipoglicemia).",
          "Técnicas de respiração e reasseguramento.",
          "Benzodiazepínico se sintomas incapacitantes.",
        ],
      },
    ],
    [
      doseLine("Lorazepam", isAdult ? "1–2 mg" : formatMg(weightBasedDose(params.weightKg, 0.05, 2)), "VO/SL", {
        notes: "Dose única ou curta duração.",
      }),
    ]
  );
};

const calculateOverdose: CalculatorFn = (params) => {
  return calculateIntoxicacao(params);
};

const calculateSedacao: CalculatorFn = (params) => {
  const { weightKg } = params;
  const fentanylMcg = weightBasedDose(weightKg, 1, 200);
  const propofolMg = weightBasedDose(weightKg, 1, 100);

  return baseResult(
    params,
    [
      {
        title: "Sedação em VM",
        items: [
          "Alvo RASS -2 a -3 em ventilação mecânica.",
          "Analgesia antes de sedação (analgosedação).",
          "Interrupção diária se possível.",
        ],
      },
    ],
    [
      doseLine("Fentanil", `${fentanylMcg} mcg/h`, "EV infusão", {
        notes: "0,5–1 mcg/kg/h — titular.",
      }),
      doseLine("Propofol", `${formatMg(propofolMg)}/h`, "EV infusão", {
        notes: "1–2 mg/kg/h — monitorizar triglicerídeos.",
      }),
      doseLine("Midazolam", `${formatMg(weightBasedDose(weightKg, 0.05, 5))}/h`, "EV infusão", {
        notes: "Alternativa — risco de delirium prolongado.",
      }),
    ]
  );
};

const calculateDelirium: CalculatorFn = (params) => {
  const { weightKg } = params;
  const ageGroup = getAgeGroup(params);
  const isAdult = ageGroup === "adulto" || ageGroup === "adolescente";
  const haloperidolMg = isAdult ? 2.5 : weightBasedDose(weightKg, 0.025, 2.5);

  return baseResult(
    params,
    [
      {
        title: "Delirium agitado",
        items: [
          "Medidas não farmacológicas (orientação, presença familiar).",
          "Tratar causa base (infecção, dor, retenção).",
          "Antipsicótico em baixa dose se risco de auto/heteroagressão.",
        ],
      },
    ],
    [
      doseLine("Haloperidol", formatMg(haloperidolMg), "EV/IM", {
        notes: isAdult ? "0,5–2,5 mg" : "0,025 mg/kg.",
      }),
      doseLine("Dexmedetomidina", `${weightBasedDose(weightKg, 0.2, 14)} mcg/h`, "EV infusão", {
        notes: "0,2–0,7 mcg/kg/h — alternativa se VM.",
      }),
    ]
  );
};

const calculateParkland: CalculatorFn = (params) => {
  const { weightKg } = params;
  const volume24h = weightKg * 4;
  const first8h = volume24h / 2;

  return baseResult(
    params,
    [
      {
        title: "Fórmula de Parkland",
        items: [
          "Volume = 4 mL × peso (kg) × %SCQ.",
          "Metade nas primeiras 8 h (desde a queimadura).",
          "Restante nas 16 h seguintes.",
          "Informe %SCQ manualmente para ajuste fino.",
        ],
      },
    ],
    [
      doseLine("Ringer Lactato", formatMl(first8h), "EV", {
        notes: `Metade de ${formatMl(volume24h)}/24h para 100% SCQ — ajustar pela superfície queimada real.`,
      }),
      doseLine("Ringer Lactato", formatMl(volume24h - first8h), "EV", {
        notes: "Segunda metade nas 16 h seguintes.",
      }),
    ],
    ["Este cálculo assume 100% de superfície corporal queimada — ajuste pela SCQ real."]
  );
};

const CALCULATORS: Record<string, CalculatorFn> = {
  "pcr-adulto": calculatePcrAdulto,
  "pcr-pediatria": calculatePcrPediatria,
  anafilaxia: calculateAnafilaxia,
  isr: calculateIsr,
  "status-epilepticus": calculateStatusEpilepticus,
  bradicardia: calculateBradicardia,
  "taquicardia-instavel": calculateTaquicardiaInstavel,
  "choque-hemorragico": calculateChoqueHemorragico,
  "rebaixamento-consciencia": calculateRebaixamentoConsciencia,
  sca: calculateSca,
  "edema-pulmao": calculateEdemaPulmao,
  pericardite: calculatePericardite,
  "taquicardia-ventricular": calculateTaquicardiaVentricular,
  "avc-isquemico": calculateAvcIsquemico,
  meningite: calculateMeningite,
  asma: calculateAsma,
  dpoc: calculateDpoc,
  cad: calculateCad,
  hipoglicemia: calculateHipoglicemia,
  hipercalemia: calculateHipercalemia,
  hda: calculateHda,
  eclampsia: calculateEclampsia,
  agitacao: calculateAgitacao,
  intoxicacao: calculateIntoxicacao,
  "crise-panico": calculateCrisePanico,
  overdose: calculateOverdose,
  sedacao: calculateSedacao,
  delirium: calculateDelirium,
  parkland: calculateParkland,
};

export function calculateProtocol(
  protocolId: string,
  params: PatientParams
): ProtocolResult | null {
  const calculator = CALCULATORS[protocolId];
  if (!calculator) return null;
  return calculator(params);
}

export function hasCalculator(protocolId: string): boolean {
  return protocolId in CALCULATORS;
}
