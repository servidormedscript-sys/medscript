export function fibrinoliseIndicada(horasDor: number, angioplastiaDisponivel: boolean): boolean {
  return horasDor <= 12 && !angioplastiaDisponivel;
}

export function graceScore(input: {
  idade: number;
  fc: number;
  pas: number;
  killip: 1 | 2 | 3 | 4;
  supraSt: boolean;
}): number {
  let idadePts = 0;
  if (input.idade >= 80) idadePts = 91;
  else if (input.idade >= 70) idadePts = 73;
  else if (input.idade >= 60) idadePts = 55;
  else if (input.idade >= 50) idadePts = 36;
  else if (input.idade >= 40) idadePts = 18;

  let fcPts = 0;
  if (input.fc >= 200) fcPts = 46;
  else if (input.fc >= 150) fcPts = 36;
  else if (input.fc >= 110) fcPts = 23;
  else if (input.fc >= 90) fcPts = 13;
  else if (input.fc >= 70) fcPts = 7;

  let pasPts = 0;
  if (input.pas < 80) pasPts = 63;
  else if (input.pas < 100) pasPts = 58;
  else if (input.pas < 120) pasPts = 47;
  else if (input.pas < 140) pasPts = 37;
  else if (input.pas < 160) pasPts = 26;
  else if (input.pas < 200) pasPts = 11;

  const killipPts = { 1: 0, 2: 21, 3: 43, 4: 64 }[input.killip];
  const supra = input.supraSt ? 30 : 0;
  return idadePts + fcPts + pasPts + killipPts + supra;
}

export function graceRisco(score: number): "baixo" | "intermediario" | "alto" {
  if (score <= 108) return "baixo";
  if (score <= 140) return "intermediario";
  return "alto";
}

export function heparinaBolusUi(peso: number): number {
  return Math.min(Math.round(60 * peso), 5000);
}

export function heparinaInfusaoUi(peso: number): number {
  return Math.round(12 * peso);
}
