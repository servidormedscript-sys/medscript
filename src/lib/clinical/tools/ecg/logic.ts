export function qtcBazett(qtMs: number, fc: number): number | null {
  if (qtMs <= 0 || fc <= 0) return null;
  const rrSec = 60 / fc;
  return qtMs / Math.sqrt(rrSec);
}

export function qtcFridericia(qtMs: number, fc: number): number | null {
  if (qtMs <= 0 || fc <= 0) return null;
  const rrSec = 60 / fc;
  return qtMs / Math.cbrt(rrSec);
}

export type SexoEcg = "H" | "M" | null;

export function classificarQtc(qtc: number, sexo: SexoEcg): string {
  if (qtc > 500) return "Muito prolongado (>500 ms) — risco de Torsades";
  if (sexo === "H") {
    if (qtc > 450) return "Prolongado";
    if (qtc > 430) return "Limítrofe";
    return "Normal";
  }
  if (sexo === "M") {
    if (qtc > 470) return "Prolongado";
    if (qtc > 450) return "Limítrofe";
    return "Normal";
  }
  if (qtc > 460) return "Prolongado";
  if (qtc > 440) return "Limítrofe";
  return "Normal";
}
