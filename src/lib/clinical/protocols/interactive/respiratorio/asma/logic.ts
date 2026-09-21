export type GravidadeAsma = "leve" | "moderada" | "grave" | "muito_grave";

export function temRiscoVida(flags: {
  silencioso: boolean;
  confusao: boolean;
  cianose: boolean;
  spo2: number;
  pfe: number;
}): boolean {
  return (
    flags.silencioso ||
    flags.confusao ||
    flags.cianose ||
    (flags.spo2 > 0 && flags.spo2 < 90) ||
    (flags.pfe > 0 && flags.pfe < 25)
  );
}

export function classificarAsma(input: {
  riscoVida: boolean;
  falaDificil: boolean;
  musculatura: boolean;
  spo2: number;
  fr: number;
  pfe: number;
}): GravidadeAsma {
  if (input.riscoVida) return "muito_grave";
  const graveCount = [
    input.falaDificil,
    input.musculatura,
    input.spo2 > 0 && input.spo2 < 93,
    input.fr > 30,
    input.pfe > 0 && input.pfe <= 50,
  ].filter(Boolean).length;
  if (graveCount >= 2) return "grave";
  const modCount = [
    input.musculatura,
    input.spo2 > 0 && input.spo2 < 95,
    input.fr > 25,
    input.pfe > 0 && input.pfe < 70,
  ].filter(Boolean).length;
  if (modCount >= 1) return "moderada";
  return "leve";
}

export function prednisonaMg(pesoKg: number, pediatrico: boolean): string {
  if (pediatrico) {
    const lo = Math.min(pesoKg, 40);
    const hi = Math.min(2 * pesoKg, 40);
    return `${Math.round(lo)}–${Math.round(hi)} mg (1–2 mg/kg, máx. 40)`;
  }
  return "40–50 mg dose única";
}

export function sulfatoMagnesioMg(pesoKg: number, pediatrico: boolean): string {
  if (pediatrico) {
    const mg = Math.min(45 * pesoKg, 2000);
    return `${Math.round(mg)} mg/20–60 min (40–50 mg/kg, máx. 2 g)`;
  }
  return "2 g/20 min";
}
