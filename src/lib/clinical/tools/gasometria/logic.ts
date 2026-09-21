export type GasoInput = {
  ph: number;
  paco2: number;
  hco3: number;
  pao2?: number;
  fio2?: number;
  na?: number;
  cl?: number;
  k?: number;
  albumina?: number;
  lactato?: number;
  respCronico: boolean;
};

export function classificarPh(ph: number): "acidemia" | "alcalemia" | "normal" {
  if (ph < 7.35) return "acidemia";
  if (ph > 7.45) return "alcalemia";
  return "normal";
}

export function classificarPrimario(input: GasoInput): string {
  const { ph, paco2, hco3 } = input;
  const acidemia = ph < 7.35;
  const alcalemia = ph > 7.45;
  const co2Alto = paco2 > 45;
  const co2Baixo = paco2 < 35;
  const hco3Baixo = hco3 < 22;
  const hco3Alto = hco3 > 26;

  if (acidemia) {
    if (hco3Baixo && !co2Alto) return "Acidose metabólica primária";
    if (co2Alto && !hco3Baixo) return "Acidose respiratória primária";
    if (hco3Baixo && co2Alto) return "Distúrbio misto (acidemia)";
    return "Acidemia — avaliar compensação/misto";
  }
  if (alcalemia) {
    if (hco3Alto && !co2Baixo) return "Alcalose metabólica primária";
    if (co2Baixo && !hco3Alto) return "Alcalose respiratória primária";
    if (hco3Alto && co2Baixo) return "Distúrbio misto (alcalemia)";
    return "Alcalemia — avaliar compensação/misto";
  }
  if (co2Alto || co2Baixo || hco3Baixo || hco3Alto) {
    return "pH normal — distúrbio compensado ou misto";
  }
  return "Gasometria sem distúrbio primário evidente";
}

export function compensacaoEsperada(primario: string, input: GasoInput): { esperado: number; tol: number; label: string } | null {
  const { paco2, hco3, respCronico } = input;
  if (primario.includes("metabólica") && primario.includes("Acidose")) {
    return { esperado: 1.5 * hco3 + 8, tol: 2, label: "PaCO₂ (Winter)" };
  }
  if (primario.includes("metabólica") && primario.includes("Alcalose")) {
    return { esperado: 40 + 0.7 * (hco3 - 24), tol: 1.5, label: "PaCO₂" };
  }
  if (primario.includes("respiratória") && primario.includes("Acidose")) {
    const delta = paco2 - 40;
    const esp = 24 + (respCronico ? 3.5 : 1) * (delta / 10);
    return { esperado: esp, tol: 2, label: "HCO₃" };
  }
  if (primario.includes("respiratória") && primario.includes("Alcalose")) {
    const delta = 40 - paco2;
    const esp = 24 - (respCronico ? 4 : 2) * (delta / 10);
    return { esperado: esp, tol: 2, label: "HCO₃" };
  }
  return null;
}

export function anionGap(na: number, cl: number, hco3: number): number | null {
  if (!na || !cl || !hco3) return null;
  return na - (cl + hco3);
}

export function anionGapCorrigido(ag: number, albumina: number): number {
  if (albumina <= 0) return ag;
  return ag + 2.5 * (4 - albumina);
}

export function deltaRatio(agUsado: number, hco3: number): number | null {
  if (hco3 >= 24) return null;
  return (agUsado - 12) / (24 - hco3);
}

export function interpretarDeltaRatio(r: number): string {
  if (r < 0.4) return "Acidose hiperclorêmica predominante";
  if (r < 0.8) return "Acidose mista";
  if (r <= 2) return "Acidose com AG elevado “pura”";
  return "Alcalose metabólica associada ou HCO₃ basal alto";
}

export function pafi(pao2: number, fio2Pct: number): number | null {
  if (!pao2 || !fio2Pct) return null;
  return pao2 / (fio2Pct / 100);
}

export function berlinSdra(pafiVal: number): string {
  if (pafiVal <= 100) return "SDRA grave (PaO₂/FiO₂ ≤100)";
  if (pafiVal <= 200) return "SDRA moderada";
  if (pafiVal <= 300) return "SDRA leve";
  return "Relação >300 — investigar contexto clínico";
}
