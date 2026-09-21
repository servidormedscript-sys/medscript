/** Bundle de sepse (Sepsis-3 / surviving sepsis — referência assistencial) */
export function qsofaFromVitals(fr: number, pas: number, alteredMental: boolean): number {
  let s = 0;
  if (fr >= 22) s++;
  if (pas <= 100) s++;
  if (alteredMental) s++;
  return s;
}

export function lactateInterpretation(lactate: number): "normal" | "elevated" | "severe" {
  if (lactate <= 2) return "normal";
  if (lactate <= 4) return "elevated";
  return "severe";
}

export function volumeResuscitationMl(pesoKg: number): { min: number; max: number } {
  return { min: Math.round(pesoKg * 30), max: Math.round(pesoKg * 30) };
}
