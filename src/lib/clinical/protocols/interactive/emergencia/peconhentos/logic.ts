export type AccidentType =
  | "botropico"
  | "crotalico"
  | "laquetico"
  | "elapidico"
  | "escorpionico"
  | "loxosceles"
  | "phoneutria"
  | "latrodectus";

export type Severity = "leve" | "moderado" | "grave";

export const ACCIDENT_OPTIONS: { id: AccidentType; label: string }[] = [
  { id: "botropico", label: "Botrópico" },
  { id: "crotalico", label: "Crotálico" },
  { id: "laquetico", label: "Laquético" },
  { id: "elapidico", label: "Elapídico" },
  { id: "escorpionico", label: "Escorpiônico" },
  { id: "loxosceles", label: "Loxosceles (loxoscelismo)" },
  { id: "phoneutria", label: "Phoneutria (foneutrismo)" },
  { id: "latrodectus", label: "Latrodectus (latrodectismo)" },
];

const SEVERITY_LABEL: Record<Severity, string> = {
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
};

export function severityOptionsFor(type: AccidentType): { id: Severity; label: string }[] {
  if (type === "laquetico") {
    return [
      { id: "moderado", label: SEVERITY_LABEL.moderado },
      { id: "grave", label: SEVERITY_LABEL.grave },
    ];
  }
  if (type === "latrodectus") {
    return [
      { id: "leve", label: SEVERITY_LABEL.leve },
      { id: "grave", label: SEVERITY_LABEL.grave },
    ];
  }
  return [
    { id: "leve", label: SEVERITY_LABEL.leve },
    { id: "moderado", label: SEVERITY_LABEL.moderado },
    { id: "grave", label: SEVERITY_LABEL.grave },
  ];
}

export type AmpouleResult = {
  /** Texto para exibição (ex.: "12", "2–4") */
  display: string;
  /** 0 = soro não indicado; null = faixa sem número único */
  numericAmpoules: number | null;
  antivenomIndicated: boolean;
};

function ampDisplay(n: number): AmpouleResult {
  return {
    display: String(n),
    numericAmpoules: n,
    antivenomIndicated: n > 0,
  };
}

function ampRange(display: string): AmpouleResult {
  return {
    display,
    numericAmpoules: null,
    antivenomIndicated: true,
  };
}

export function ampoulesFor(type: AccidentType, severity: Severity): AmpouleResult {
  const table: Partial<Record<AccidentType, Partial<Record<Severity, AmpouleResult>>>> = {
    botropico: {
      leve: ampDisplay(3),
      moderado: ampDisplay(6),
      grave: ampDisplay(12),
    },
    crotalico: {
      leve: ampDisplay(5),
      moderado: ampDisplay(10),
      grave: ampDisplay(20),
    },
    laquetico: {
      moderado: ampDisplay(10),
      grave: ampDisplay(20),
    },
    elapidico: {
      leve: ampDisplay(0),
      moderado: ampDisplay(5),
      grave: ampDisplay(10),
    },
    escorpionico: {
      leve: ampDisplay(0),
      moderado: ampDisplay(3),
      grave: ampDisplay(6),
    },
    loxosceles: {
      leve: ampDisplay(0),
      moderado: ampDisplay(5),
      grave: ampDisplay(10),
    },
    phoneutria: {
      leve: ampDisplay(0),
      moderado: ampRange("2–4"),
      grave: ampRange("5–10"),
    },
    latrodectus: {
      leve: ampDisplay(0),
      grave: ampDisplay(0),
    },
  };

  const row = table[type];
  const cell = row?.[severity];
  if (cell) return cell;
  return ampDisplay(0);
}

export const ANTIVENOM_ADMIN =
  "Diluir em SF ou SG 5% (proporção 1:2 a 1:5). Administrar IV 8–12 mL/min ou em infusão em 10–15 min.";

export function speciesNotes(type: AccidentType): string[] {
  const common = [
    "Imobilizar membro; não torniquete, não sucção, não cortes.",
    "Analgesia e suporte conforme gravidade.",
  ];
  if (type === "crotalico") {
    return [
      ...common,
      "Monitorar função renal por risco de mioglobinúria.",
    ];
  }
  if (type === "elapidico") {
    return [
      ...common,
      "Vigilância respiratória por ≥ 24 h (neurotoxicidade).",
    ];
  }
  if (type === "laquetico") {
    return [
      ...common,
      "Laquético: não há classificação leve — sempre considerar soroterapia.",
    ];
  }
  if (type === "latrodectus") {
    return [
      ...common,
      "Latrodectismo: apenas graus leve e grave; soro antiveneno não indicado (0 amp.).",
    ];
  }
  return common;
}

export function prednisoneLoxosceles(
  severity: Severity,
  ageYears: number,
  weightKg: number
): string | null {
  if (severity === "leve") return null;
  const days = "× 5 dias";
  if (ageYears < 12 && weightKg > 0) {
    const mg = Math.round(weightKg * 1);
    return `Prednisona ${mg} mg/dia (1 mg/kg/dia) ${days}`;
  }
  return `Prednisona 40 mg/dia (adulto) ${days}`;
}

export function showPediatricEscorpionWarning(
  type: AccidentType,
  ageYears: number
): boolean {
  return type === "escorpionico" && ageYears < 12;
}

export type ProtocolLinks = {
  choque: boolean;
  eap: boolean;
  convulsao: boolean;
};

export function linksFor(type: AccidentType, severity: Severity): ProtocolLinks {
  const grave = severity === "grave";
  const choque =
    grave &&
    (type === "botropico" || type === "crotalico" || type === "laquetico");
  const neuroToxic =
    grave && (type === "escorpionico" || type === "phoneutria");
  return {
    choque,
    eap: neuroToxic,
    convulsao: neuroToxic,
  };
}

export function isValidSeverityForType(
  type: AccidentType,
  severity: Severity
): boolean {
  return severityOptionsFor(type).some((o) => o.id === severity);
}
