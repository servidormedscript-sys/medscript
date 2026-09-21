export type GrauRebaix = "grave" | "moderado" | "leve";

export function classificarGlasgow(glasgow: number): GrauRebaix {
  if (glasgow <= 8) return "grave";
  if (glasgow <= 12) return "moderado";
  return "leve";
}

export function glicoseEvMl(pesoKg: number, pediatrico: boolean): string {
  if (pediatrico && pesoKg > 0) {
    const lo = Math.min(2 * pesoKg, 100);
    const hi = Math.min(4 * pesoKg, 100);
    return `Glicose 25% ${Math.round(lo)}–${Math.round(hi)} mL (2–4 mL/kg, máx. 25 g)`;
  }
  return "Glicose 50% 20–50 mL";
}

export const NALOXONA_MAX_CUMULATIVO_MG = 10;
export const NALOXONA_TETO_DOSES = 5;
