export type ClasseGlicemia =
  | "normal"
  | "hipo_grave"
  | "hipo_mod"
  | "hiper_importante"
  | "hiper_grave";

export function limitesHipoHiper(gestante: boolean): { hipo: number; hiper: number } {
  return gestante ? { hipo: 60, hiper: 180 } : { hipo: 54, hiper: 250 };
}

export function classificarGlicemia(input: {
  hgt: number;
  glasgow: number;
  gestante: boolean;
}): ClasseGlicemia {
  const { hipo, hiper } = limitesHipoHiper(input.gestante);
  const { hgt, glasgow } = input;
  if (hgt <= 0) return "normal";
  if (hgt < hipo || glasgow <= 8) return "hipo_grave";
  if (hgt < 70) return "hipo_mod";
  if (hgt >= 600 || (hgt >= hiper && glasgow <= 8)) return "hiper_grave";
  if (hgt >= hiper && glasgow > 8) return "hiper_importante";
  return "normal";
}

export function doseInsulinaKg(pediatrico: boolean, idadeAnos: number): number {
  if (pediatrico) return idadeAnos > 5 ? 0.075 : 0.05;
  return 0.1;
}

export function anionGap(na: number, cl: number, hco3: number): number | null {
  if (!na || !cl || !hco3) return null;
  return na - (cl + hco3);
}

export function osmolaridade(na: number, glicemia: number, ureia: number): number | null {
  if (!na || !glicemia) return null;
  const u = ureia || 0;
  return 2 * na + glicemia / 18 + u / 2.8;
}

export function alertaEhh(osm: number | null, hgt: number): boolean {
  return hgt > 600 && osm != null && osm > 320;
}
