export type DisturbioId =
  | "hiperk"
  | "hipok"
  | "hiponat"
  | "hipernat"
  | "hipocal"
  | "hipercal"
  | "hipomg";

export type GravidadeEle = "critico" | "grave" | "moderado" | "leve" | "normal";

export function gravidade(disturbio: DisturbioId, valor: number): GravidadeEle {
  switch (disturbio) {
    case "hiperk":
      if (valor >= 6.5) return "critico";
      if (valor >= 6) return "grave";
      if (valor >= 5.5) return "moderado";
      if (valor > 5) return "leve";
      return "normal";
    case "hipok":
      if (valor < 2.5) return "critico";
      if (valor < 3) return "moderado";
      if (valor < 3.5) return "leve";
      return "normal";
    case "hiponat":
      if (valor < 120) return "critico";
      if (valor < 125) return "grave";
      if (valor < 130) return "moderado";
      if (valor < 135) return "leve";
      return "normal";
    case "hipernat":
      if (valor > 160) return "critico";
      if (valor > 155) return "grave";
      if (valor > 150) return "moderado";
      if (valor > 145) return "leve";
      return "normal";
    case "hipocal":
      if (valor < 7) return "grave";
      if (valor < 8) return "moderado";
      if (valor < 8.5) return "leve";
      return "normal";
    case "hipercal":
      if (valor > 14) return "critico";
      if (valor > 12) return "moderado";
      if (valor > 10.5) return "leve";
      return "normal";
    case "hipomg":
      if (valor < 1) return "critico";
      if (valor < 1.2) return "grave";
      if (valor < 1.5) return "moderado";
      if (valor < 1.8) return "leve";
      return "normal";
    default:
      return "normal";
  }
}

export function actLitros(pesoKg: number, sexo: "H" | "M"): number {
  return pesoKg * (sexo === "H" ? 0.6 : 0.5);
}

export function calcNaCl3Hiponatremia(pesoKg: number, sexo: "H" | "M", naAtual: number): number {
  const act = actLitros(pesoKg, sexo);
  const deltaPorLitro = (513 - naAtual) / (act + 1);
  if (deltaPorLitro <= 0) return 0;
  return Math.round((6 / deltaPorLitro) * 1000);
}

export function calcDeficitAguaMl(pesoKg: number, sexo: "H" | "M", naAtual: number): {
  volumeMl: number;
  duracaoHoras: number;
} {
  const act = actLitros(pesoKg, sexo);
  const volumeMl = Math.round(act * (naAtual / 140 - 1) * 1000);
  const duracaoHoras = Math.max(48, Math.ceil((naAtual - 140) / 0.5));
  return { volumeMl: Math.max(0, volumeMl), duracaoHoras };
}

export function alertaArritmia(g: GravidadeEle, disturbio: DisturbioId): boolean {
  if (g !== "critico" && g !== "grave") return false;
  return disturbio === "hiperk" || disturbio === "hipok" || disturbio === "hipomg";
}
