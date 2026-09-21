export function cockcroftGault(idade: number, peso: number, creat: number, feminino: boolean): number | null {
  if (idade <= 0 || peso <= 0 || creat <= 0) return null;
  let cl = ((140 - idade) * peso) / (72 * creat);
  if (feminino) cl *= 0.85;
  return Math.round(cl);
}

export function ckdEpi2021(creat: number, idade: number, feminino: boolean): number | null {
  if (creat <= 0 || idade <= 0) return null;
  const k = feminino ? 0.7 : 0.9;
  const a = creat <= k ? (feminino ? -0.241 : -0.302) : -1.2;
  let tfg = 142 * Math.pow(creat / k, a) * Math.pow(0.9938, idade);
  if (feminino) tfg *= 1.012;
  return Math.round(tfg);
}

export function estagioDrc(tfge: number): string {
  if (tfge >= 90) return "G1 — normal/alta";
  if (tfge >= 60) return "G2 — leve";
  if (tfge >= 45) return "G3a — leve-moderada";
  if (tfge >= 30) return "G3b — moderada-grave";
  if (tfge >= 15) return "G4 — grave";
  return "G5 — falência renal";
}

export function ajusteDoseClCr(clcr: number): string {
  if (clcr >= 90) return "Sem ajuste usual.";
  if (clcr >= 60) return "Leve — checar bula (janela estreita).";
  if (clcr >= 30) return "Moderada — ajuste necessário (ATB, HBPM, DOACs).";
  if (clcr >= 15) return "Grave — ajuste importante; vários contraindicados.";
  return "Falência — considerar diálise; muitos contraindicados.";
}
