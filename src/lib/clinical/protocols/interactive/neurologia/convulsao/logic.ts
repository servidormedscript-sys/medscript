export type FaseConvulsao = 1 | 2 | 3 | 4;

export function fasePorTempo(segundos: number): FaseConvulsao {
  if (segundos >= 2400) return 4;
  if (segundos >= 1200) return 3;
  if (segundos >= 300) return 2;
  return 1;
}

export function precisaIOT(fase: FaseConvulsao, glasgow: number): boolean {
  return fase >= 4 || glasgow <= 8;
}

export const BENZO_MAX_DOSES = 2;

export function diazepamMg(pesoKg: number): number {
  return Math.min(0.2 * pesoKg, 10);
}

export function midazolamIvMg(pesoKg: number): number {
  return Math.min(0.15 * pesoKg, 10);
}

export function midazolamImMg(pesoKg: number): number {
  if (pesoKg > 40) return 10;
  if (pesoKg >= 13) return 5;
  return 5;
}

export function lorazepamMg(pesoKg: number): number {
  return Math.min(0.1 * pesoKg, 4);
}

export function fenitoinaMg(pesoKg: number): number {
  return Math.min(20 * pesoKg, 1500);
}

export function acidoValproicoMg(pesoKg: number): number {
  return Math.min(40 * pesoKg, 3000);
}

export function levetiracetamMg(pesoKg: number): number {
  return Math.min(60 * pesoKg, 4500);
}

export const CAUSAS_INVESTIGACAO = [
  "Hipoglicemia",
  "Distúrbio eletrolítico",
  "Infecção / febre",
  "Trauma craniano",
  "AVC",
  "Tumor / HIC",
  "Intoxicação / abstinência",
  "Eclâmpsia / gestação",
  "Encefalite / meningite",
  "Epilepsia não tratada",
  "Hipóxia",
  "Metabólico (uremia, hepático)",
  "Psicogênico",
] as const;
