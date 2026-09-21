export type RiscoCssrs = "alto" | "moderado" | "baixo" | "nenhum";

export type CssrsInput = {
  intencaoPlano: boolean;
  comportamentoRecente: boolean;
  metodoPensado: boolean;
  comportamentoAntigo: boolean;
  ideacaoPassivaAtiva: boolean;
};

export function riscoCssrs(c: CssrsInput): RiscoCssrs {
  if (c.intencaoPlano || c.comportamentoRecente) return "alto";
  if (c.metodoPensado || c.comportamentoAntigo) return "moderado";
  if (c.ideacaoPassivaAtiva) return "baixo";
  return "nenhum";
}

export type SadPersonsKey =
  | "sexo"
  | "idade"
  | "depressao"
  | "previo"
  | "etilismo"
  | "organizado"
  | "semRede"
  | "doencaCronica"
  | "semEmprego"
  | "solteiro";

export const SAD_PERSONS_LABELS: Record<SadPersonsKey, string> = {
  sexo: "Sexo (homem)",
  idade: "Idade (<19 ou >45)",
  depressao: "Depressão grave",
  previo: "Tentativa prévia",
  etilismo: "Abuso de álcool",
  organizado: "Plano organizado",
  semRede: "Sem rede de apoio",
  doencaCronica: "Doença crônica / terminal",
  semEmprego: "Desemprego",
  solteiro: "Divorciado / viúvo / solteiro",
};

export function sadPersonsScore(flags: Record<SadPersonsKey, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function sadPersonsInterpretacao(score: number): string {
  if (score <= 5) return "Possivelmente seguro para alta (reavaliar contexto).";
  if (score <= 8) return "Provavelmente necessita avaliação psiquiátrica.";
  return "Provavelmente necessita internação.";
}
