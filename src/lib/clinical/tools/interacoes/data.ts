export type SeveridadeInter = "grave" | "moderada";

export type Interacao = {
  a: string;
  b: string;
  severidade: SeveridadeInter;
  texto: string;
};

export const DRUGS = [
  "Adenosina",
  "Amiodarona",
  "AAS",
  "AINE",
  "Aminoglicosídeo",
  "Betabloqueador",
  "Bloqueador neuromuscular",
  "BRA",
  "Claritromicina",
  "Clopidogrel",
  "Contraste iodado",
  "Digoxina",
  "Diltiazem/Verapamil",
  "Dipiridamol",
  "Eritromicina",
  "Espironolactona",
  "Estatina",
  "Fenitoína",
  "Furosemida",
  "IECA",
  "Inibidor de PDE5",
  "Insulina",
  "ISRS/IMAO",
  "Linezolida",
  "Lítio",
  "Metformina",
  "Metronidazol",
  "Metotrexato",
  "Nitroglicerina/Nitrato",
  "Opioide",
  "Prasugrel",
  "Sulfato de Magnésio",
  "Teofilina/Cafeína",
  "Ticagrelor",
  "Vancomicina",
  "Varfarina",
  "Benzodiazepínico",
].sort((a, b) => a.localeCompare(b, "pt-BR"));

function pairKey(a: string, b: string) {
  return [a, b].sort((x, y) => x.localeCompare(y, "pt-BR")).join("|");
}

export const INTERACOES: Interacao[] = [
  { a: "IECA", b: "BRA", severidade: "grave", texto: "Bloqueio duplo do SRAA — evitar associação." },
  { a: "IECA", b: "Espironolactona", severidade: "moderada", texto: "Risco de hipercalemia." },
  { a: "BRA", b: "Espironolactona", severidade: "moderada", texto: "Risco de hipercalemia." },
  { a: "IECA", b: "AINE", severidade: "moderada", texto: "LRA / “triple whammy”." },
  { a: "BRA", b: "AINE", severidade: "moderada", texto: "Lesão renal aguda." },
  { a: "Varfarina", b: "AAS", severidade: "grave", texto: "Sangramento aumentado." },
  { a: "Varfarina", b: "Clopidogrel", severidade: "grave", texto: "Sangramento aumentado." },
  { a: "Varfarina", b: "Ticagrelor", severidade: "grave", texto: "Sangramento aumentado." },
  { a: "Varfarina", b: "Prasugrel", severidade: "grave", texto: "Sangramento aumentado." },
  { a: "Varfarina", b: "Amiodarona", severidade: "grave", texto: "Inibição CYP2C9 — reduzir varfarina ~30–50%." },
  { a: "Varfarina", b: "Fenitoína", severidade: "moderada", texto: "Interação bidirecional imprevisível." },
  { a: "Varfarina", b: "Metronidazol", severidade: "moderada", texto: "Potencializa varfarina." },
  { a: "Digoxina", b: "Amiodarona", severidade: "grave", texto: "Pode dobrar nível de digoxina — reduzir ~50%." },
  { a: "Digoxina", b: "Diltiazem/Verapamil", severidade: "grave", texto: "Bloqueio AV / toxicidade." },
  { a: "Betabloqueador", b: "Diltiazem/Verapamil", severidade: "grave", texto: "Bradicardia extrema / choque." },
  { a: "Betabloqueador", b: "Amiodarona", severidade: "grave", texto: "Bradicardia / BAV." },
  { a: "Diltiazem/Verapamil", b: "Amiodarona", severidade: "grave", texto: "Bradicardia / BAV." },
  { a: "Adenosina", b: "Dipiridamol", severidade: "moderada", texto: "Potencializa/prolonga adenosina." },
  { a: "Adenosina", b: "Teofilina/Cafeína", severidade: "moderada", texto: "Antagoniza adenosina." },
  { a: "Linezolida", b: "ISRS/IMAO", severidade: "grave", texto: "Síndrome serotoninérgica." },
  { a: "Sulfato de Magnésio", b: "Bloqueador neuromuscular", severidade: "moderada", texto: "Potencializa bloqueio neuromuscular." },
  { a: "Estatina", b: "Claritromicina", severidade: "grave", texto: "Rabdomiólise — inibição CYP3A4." },
  { a: "Estatina", b: "Eritromicina", severidade: "grave", texto: "Rabdomiólise — inibição CYP3A4." },
  { a: "Estatina", b: "Amiodarona", severidade: "moderada", texto: "Limitar sinvastatina a 20 mg/dia." },
  { a: "Nitroglicerina/Nitrato", b: "Inibidor de PDE5", severidade: "grave", texto: "Hipotensão refratária — contraindicado." },
  { a: "Insulina", b: "Betabloqueador", severidade: "moderada", texto: "Mascara hipoglicemia." },
  { a: "Opioide", b: "Benzodiazepínico", severidade: "grave", texto: "Depressão respiratória sinérgica." },
  { a: "Lítio", b: "IECA", severidade: "grave", texto: "Intoxicação por lítio." },
  { a: "Lítio", b: "Furosemida", severidade: "moderada", texto: "Eleva litemia." },
  { a: "Metformina", b: "Contraste iodado", severidade: "moderada", texto: "Risco de acidose lática — suspender conforme protocolo." },
  { a: "Vancomicina", b: "Aminoglicosídeo", severidade: "moderada", texto: "Nefrotoxicidade aditiva." },
  { a: "AAS", b: "Metotrexato", severidade: "grave", texto: "Reduz excreção renal do metotrexato." },
];

const MAP = new Map(INTERACOES.map((i) => [pairKey(i.a, i.b), i]));

export function buscarInteracao(a: string, b: string): Interacao | null {
  if (!a || !b || a === b) return null;
  return MAP.get(pairKey(a, b)) ?? null;
}
