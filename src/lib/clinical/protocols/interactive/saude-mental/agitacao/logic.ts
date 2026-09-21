export type RassAgita = 4 | 3 | 2 | 1 | 0 | -1 | null;

export const RASS_OPTIONS: { value: RassAgita; label: string }[] = [
  { value: 4, label: "+4 Combativo" },
  { value: 3, label: "+3 Muito agitado" },
  { value: 2, label: "+2 Agitado" },
  { value: 1, label: "+1 Inquieto" },
  { value: 0, label: "0 Alerta e calmo" },
  { value: -1, label: "-1 Sonolento" },
];

export type CondutaAgita =
  | "selecionar"
  | "sem_agitacao"
  | "desescalada_vo"
  | "contencao_quimica";

export function condutaAgita(rass: RassAgita): CondutaAgita {
  if (rass === null) return "selecionar";
  if (rass <= 0) return "sem_agitacao";
  if (rass <= 2) return "desescalada_vo";
  return "contencao_quimica";
}

export function alertaCausaOrganica(rass: RassAgita): boolean {
  return rass !== null && rass >= 3;
}

export type OpcaoFarmaco = {
  id: string;
  nome: string;
  dose: string;
  nota?: string;
  grau: string;
  qtRisk?: boolean;
};

export const OPCOES_FARMACO: OpcaoFarmaco[] = [
  {
    id: "hali-prom",
    nome: "Haloperidol + Prometazina IM",
    dose: "2,5–10 mg + 25–50 mg (máx. 30+100 mg/24 h), início ~30 min",
    grau: "Grau A",
  },
  {
    id: "hali-mida",
    nome: "Haloperidol + Midazolam IM",
    dose: "2,5 mg + 7,5–15 mg (máx. 30 mg/24 h), início ~20 min",
    grau: "Grau A",
  },
  {
    id: "mida",
    nome: "Midazolam IM isolado",
    dose: "Até 15 mg, repetir 30 min, início 15–20 min",
    grau: "Grau A",
  },
  {
    id: "olanz",
    nome: "Olanzapina IM",
    dose: "2,5–10 mg (não associar BZD IM), início 15–45 min",
    grau: "Grau A",
  },
  {
    id: "zipra",
    nome: "Ziprasidona IM",
    dose: "10–20 mg, +10 mg/2 h ou +20 mg/4 h (máx. 40 mg/24 h)",
    grau: "Grau A",
    qtRisk: true,
  },
  {
    id: "drope",
    nome: "Droperidol + Midazolam IM",
    dose: "10 mg + 5 mg (máx. 20+15 mg/24 h), início ~15 min",
    grau: "Grau B",
    qtRisk: true,
  },
  {
    id: "risper",
    nome: "Risperidona VO/ODT",
    dose: "2–3 mg, repetir 1/1 h (máx. 8 mg/24 h) — agitação leve/colaborativa",
    grau: "Grau A",
  },
];

export const QT_IV_AVISO =
  "Risco de QT longo: preferir via oral; IV é Grau D nas diretrizes brasileiras (Baldacara 2019).";
