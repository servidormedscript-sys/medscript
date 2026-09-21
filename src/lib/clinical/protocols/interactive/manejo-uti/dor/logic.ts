export function clampEva(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n)));
}

export type DegrauDor = 0 | 1 | 2 | 3;

export function degrauDor(eva: number): DegrauDor {
  const e = clampEva(eva);
  if (e === 0) return 0;
  if (e <= 3) return 1;
  if (e <= 6) return 2;
  return 3;
}

export const DEGRAU1 = [
  "Dipirona 1–2 g 6/6 h (máx. 4 g/dia)",
  "Paracetamol 500–1000 mg 6/6 h (máx. 4 g/dia)",
  "Ibuprofeno 400–600 mg 8/8 h (máx. 3200 mg/dia)",
  "Diclofenaco 50 mg 8/8 h (máx. 150 mg/dia)",
  "Cetoprofeno 100 mg EV 8/8 h (máx. 300 mg/dia)",
];

export const DEGRAU2 = [
  "Tramadol 50–100 mg 6/6 h ou 4/4 h (máx. ~400 mg/dia)",
  "Codeína 30–60 mg 4/4–6/6 h",
];

export const DEGRAU3 = [
  "Morfina 2–10 mg EV titulação lenta (2 mg/5–10 min)",
  "Morfina 5–20 mg IM/SC",
];

export function reavaliacaoSugerida(degrau: DegrauDor): string {
  if (degrau === 3) return "Reavaliar em 15–30 min (EV/IM).";
  if (degrau >= 1) return "Reavaliar em 30–60 min (VO) ou 15–30 min se EV.";
  return "";
}
