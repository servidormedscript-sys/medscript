export function paOk(pas: number | null, pad: number | null): boolean {
  const pasOk = pas == null || pas === 0 || pas < 185;
  const padOk = pad == null || pad === 0 || pad < 110;
  return pasOk && padOk;
}

export type AvcClassificacao =
  | "hemorragico"
  | "ait"
  | "sem_tempo"
  | "trombolise"
  | "trombectomia"
  | "fora_janela";

export function classificarAvc(input: {
  hemorragico: boolean;
  ait: boolean;
  minutos: number | null;
  pas: number;
  pad: number;
}): AvcClassificacao {
  if (input.hemorragico) return "hemorragico";
  if (input.ait) return "ait";
  if (input.minutos == null || Number.isNaN(input.minutos)) return "sem_tempo";
  const ok = paOk(input.pas || null, input.pad || null);
  if (input.minutos <= 270 && ok) return "trombolise";
  if (input.minutos <= 1440 && ok) return "trombectomia";
  return "fora_janela";
}

export function trombectomiaJanela(minutos: number): "padrao" | "estendida" | "fora" {
  if (minutos <= 360) return "padrao";
  if (minutos <= 1440) return "estendida";
  return "fora";
}

export function alteplaseMg(pesoKg: number): { total: number; bolus: number; infusao: number } {
  const total = Math.min(pesoKg * 0.9, 90);
  const bolus = total * 0.1;
  const infusao = total * 0.9;
  return { total: round1(total), bolus: round1(bolus), infusao: round1(infusao) };
}

export function tenecteplaseMg(pesoKg: number): number {
  return round1(Math.min(pesoKg * 0.25, 25));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function classificacaoLabel(c: AvcClassificacao): string {
  const map: Record<AvcClassificacao, string> = {
    hemorragico: "AVC hemorrágico",
    ait: "AIT",
    sem_tempo: "Informe minutos desde o início dos sintomas",
    trombolise: "Candidato à trombólise (≤4,5 h, PA ok)",
    trombectomia: "Candidato à trombectomia (janela estendida até 24 h, PA ok)",
    fora_janela: "Fora da janela ou PA não controlada",
  };
  return map[c];
}
