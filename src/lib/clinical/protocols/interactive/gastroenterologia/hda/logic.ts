export function gbsUreia(ureiaMgDl: number): number {
  const mmol = ureiaMgDl * 0.1665;
  if (mmol >= 25) return 6;
  if (mmol >= 10) return 4;
  if (mmol >= 8) return 3;
  if (mmol >= 6.5) return 2;
  return 0;
}

export function gbsHb(hb: number, sexo: "H" | "M"): number {
  if (sexo === "H") {
    if (hb >= 13) return 0;
    if (hb >= 12) return 1;
    if (hb >= 10) return 3;
    return 6;
  }
  if (hb >= 12) return 0;
  if (hb >= 10) return 1;
  return 6;
}

export function gbsPas(pas: number): number {
  if (pas >= 110) return 0;
  if (pas >= 100) return 1;
  if (pas >= 90) return 2;
  return 3;
}

export function gbsTotal(input: {
  ureia: number;
  hb: number;
  sexo: "H" | "M";
  pas: number;
  fc: number;
  melena: boolean;
  sincope: boolean;
  hepatopatia: boolean;
  ic: boolean;
}): number {
  let t = gbsUreia(input.ureia) + gbsHb(input.hb, input.sexo) + gbsPas(input.pas);
  if (input.fc >= 100) t += 1;
  if (input.melena) t += 1;
  if (input.sincope) t += 2;
  if (input.hepatopatia) t += 2;
  if (input.ic) t += 2;
  return t;
}

export function gbsRisco(total: number): "baixo" | "intermediario" | "alto" {
  if (total === 0) return "baixo";
  if (total < 7) return "intermediario";
  return "alto";
}

export function rockallClinico(input: {
  idade: number;
  pas: number;
  fc: number;
  comorbidadeGrave: boolean;
  icOuHepato: boolean;
}): number {
  let s = 0;
  if (input.idade >= 80) s += 2;
  else if (input.idade >= 60) s += 1;
  if (input.pas < 100) s += 2;
  else if (input.fc >= 100) s += 1;
  if (input.comorbidadeGrave) s += 3;
  else if (input.icOuHepato) s += 2;
  return s;
}

export function instabilidadeHda(pas: number, fc: number): boolean {
  return pas < 90 || fc >= 120;
}
