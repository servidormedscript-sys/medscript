export type ReversibleCause = {
  id: string;
  group: "H" | "T";
  label: string;
  treatment: string;
};

export const REVERSIBLE_CAUSES_ADULT: ReversibleCause[] = [
  {
    id: "h-hipoxia",
    group: "H",
    label: "Hipoxia",
    treatment: "Ventilação/oxigenação — IOT se necessário.",
  },
  {
    id: "h-hipovolemia",
    group: "H",
    label: "Hipovolemia",
    treatment: "SF 0,9% ou cristaloide — investigar sangramento.",
  },
  {
    id: "h-hidrogenionico",
    group: "H",
    label: "H+ (acidose)",
    treatment: "Bicarbonato 8,4% 1 mEq/kg (≈50–100 mEq) bolus se acidose grave.",
  },
  {
    id: "h-hipo-hipercalemia",
    group: "H",
    label: "Hipo/hipercalemia",
    treatment:
      "Gluconato de Cálcio 10% 1 g (10 mL); Insulina 10 UI + Glicose 50% 50 mL (25 g); Bicarbonato 50 mEq se acidose.",
  },
  {
    id: "h-hipotermia",
    group: "H",
    label: "Hipotermia",
    treatment: "Aquecimento ativo; considerar ECMO.",
  },
  {
    id: "t-trombose-coronariana",
    group: "T",
    label: "Trombose coronariana",
    treatment:
      "Alteplase 50 mg IV bolus — manter RCP 60–90 min pós-trombólise; cateterismo.",
  },
  {
    id: "t-tep",
    group: "T",
    label: "TEP / trombose pulmonar",
    treatment: "Alteplase 50 mg, podendo repetir +50 mg em 15 min (TEP maciço).",
  },
  {
    id: "t-tensione",
    group: "T",
    label: "Tórax (pneumotórax hipertensivo)",
    treatment: "Descompressão imediata; Salbutamol 10–20 mg nebulizado se broncoespasmo.",
  },
  {
    id: "t-tamponamento",
    group: "T",
    label: "Tamponamento cardíaco",
    treatment: "Pericardiocentese / cirurgia de urgência.",
  },
  {
    id: "t-toxicos",
    group: "T",
    label: "Tóxicos",
    treatment:
      "Bicarbonato 1–2 mEq/kg (tricíclicos); Naloxona 0,4–2 mg (opioides); Gluconato 10% 3 g + Glucagon 5–10 mg + insulina euglicêmica 1 UI/kg (BB/BCC); emulsão lipídica 20% 1,5 mL/kg bolus (1 min) + 0,25 mL/kg/min (anestésico local).",
  },
];

export const RHYTHM_OPTIONS = [
  {
    id: "fv" as const,
    label: "FV",
    chocavel: true,
    hint: "Fibrilação ventricular",
  },
  {
    id: "tvsp" as const,
    label: "TV sem pulso",
    chocavel: true,
    hint: "Taquicardia ventricular sem pulso",
  },
  {
    id: "assistolia" as const,
    label: "Assistolia",
    chocavel: false,
    hint: "Linha reta — não chocar",
  },
  {
    id: "aesp" as const,
    label: "AESP",
    chocavel: false,
    hint: "Atividade elétrica sem pulso",
  },
  {
    id: "bradi-sem-pulso" as const,
    label: "Bradicardia sem pulso",
    chocavel: false,
    hint: "Tratar como AESP",
  },
];

export type RitmoAdulto = (typeof RHYTHM_OPTIONS)[number]["id"];
