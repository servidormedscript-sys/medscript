export type DoseUnit =
  | "mcg/kg/min"
  | "mcg/min"
  | "mcg/kg/h"
  | "mg/kg/h"
  | "mg/h"
  | "g/h";

export type GotejPreset = {
  key: string;
  label: string;
  mg: number;
  volumeMl: number;
  unit: DoseUnit;
  doseSugerida?: number;
};

export const PRESETS: GotejPreset[] = [
  { key: "noradrenalina", label: "Noradrenalina", mg: 16, volumeMl: 250, unit: "mcg/kg/min", doseSugerida: 0.1 },
  { key: "adrenalina", label: "Adrenalina", mg: 1, volumeMl: 250, unit: "mcg/kg/min", doseSugerida: 0.05 },
  { key: "dobutamina", label: "Dobutamina", mg: 250, volumeMl: 250, unit: "mcg/kg/min", doseSugerida: 5 },
  { key: "dopamina", label: "Dopamina", mg: 200, volumeMl: 250, unit: "mcg/kg/min", doseSugerida: 5 },
  { key: "nitroglicerina", label: "Nitroglicerina", mg: 50, volumeMl: 250, unit: "mcg/min", doseSugerida: 10 },
  { key: "nitroprussiato", label: "Nitroprussiato", mg: 50, volumeMl: 250, unit: "mcg/kg/min", doseSugerida: 0.3 },
  { key: "milrinona", label: "Milrinona", mg: 20, volumeMl: 100, unit: "mcg/kg/min", doseSugerida: 0.375 },
  { key: "fentanil", label: "Fentanil", mg: 1, volumeMl: 100, unit: "mcg/kg/h", doseSugerida: 1 },
  { key: "midazolam", label: "Midazolam", mg: 50, volumeMl: 50, unit: "mg/kg/h", doseSugerida: 0.05 },
  { key: "propofol", label: "Propofol", mg: 1000, volumeMl: 100, unit: "mcg/kg/min", doseSugerida: 30 },
  { key: "magnesio-manut", label: "Sulfato Mg — manutenção", mg: 10000, volumeMl: 500, unit: "mg/h", doseSugerida: 1 },
  { key: "personalizado", label: "Personalizado", mg: 0, volumeMl: 250, unit: "mcg/kg/min" },
];

export function unitNeedsWeight(unit: DoseUnit): boolean {
  return unit.includes("/kg/");
}

export function doseTotalMcgMin(dose: number, unit: DoseUnit, pesoKg: number): number | null {
  if (unitNeedsWeight(unit) && pesoKg <= 0) return null;
  switch (unit) {
    case "mcg/kg/min":
      return dose * pesoKg;
    case "mcg/min":
      return dose;
    case "mcg/kg/h":
      return (dose * pesoKg) / 60;
    case "mg/kg/h":
      return (dose * pesoKg * 1000) / 60;
    case "mg/h":
      return (dose * 1000) / 60;
    case "g/h":
      return (dose * 1_000_000) / 60;
    default:
      return null;
  }
}

export function calcGotejamento(input: {
  mg: number;
  volumeMl: number;
  dose: number;
  unit: DoseUnit;
  pesoKg: number;
}): { mcgMin: number; mlH: number; gotasMin: number; microgotasMin: number } | null {
  if (input.volumeMl <= 0 || input.mg <= 0) return null;
  const mcgMin = doseTotalMcgMin(input.dose, input.unit, input.pesoKg);
  if (mcgMin == null) return null;
  const concMcgMl = (input.mg * 1000) / input.volumeMl;
  if (concMcgMl <= 0) return null;
  const mlH = (mcgMin / concMcgMl) * 60;
  return {
    mcgMin,
    mlH,
    gotasMin: mlH / 3,
    microgotasMin: mlH,
  };
}

export function getPreset(key: string): GotejPreset | undefined {
  return PRESETS.find((p) => p.key === key);
}
