export function perfilEap(pas: number): "frio-umido-grave" | "quente-umido-grave" | "quente-umido-mod" {
  if (pas < 90) return "frio-umido-grave";
  if (pas > 180) return "quente-umido-grave";
  return "quente-umido-mod";
}

export function furosemidaMg(peso: number): number {
  return Math.min(80, Math.max(40, Math.round(peso * 1)));
}

export function morfinaMg(peso: number): number {
  return Math.min(4, Math.max(2, Math.round(peso * 0.1 * 10) / 10));
}

export function hipoxemia(spo2: number, fr: number): boolean {
  return spo2 < 90 || fr > 25;
}

export function suporteVentilatorio(
  spo2: number,
  fr: number,
  glasgow: number
): "nenhum" | "atencao-vni" | "iot" {
  if (glasgow <= 8) return "iot";
  if (hipoxemia(spo2, fr) || glasgow < 13) {
    if (glasgow >= 9 && glasgow <= 12) return "atencao-vni";
    return "iot";
  }
  return "nenhum";
}

export function estabilizado(
  fr: number,
  spo2: number,
  pas: number,
  vasoativos: boolean,
  melhoraDispneia: boolean,
  diureseOk: boolean
): boolean {
  return (
    fr < 20 &&
    spo2 > 92 &&
    pas >= 100 &&
    pas <= 140 &&
    !vasoativos &&
    melhoraDispneia &&
    diureseOk
  );
}

export function diureseAdequada(mlKgH: number): boolean {
  return mlKgH > 0.5;
}
