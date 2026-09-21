export type AtbItem = {
  nome: string;
  classe: string;
  dose: string;
  diluicao: string;
  renal: string;
  kw: string;
  alerta?: string;
};

export const CLASSES_ATB = [
  "Todos",
  "Penicilinas",
  "Cefalosporinas",
  "Carbapenêmicos",
  "Glicopeptidos",
  "Lincosamidas",
  "Fluoroquinolonas",
  "Aminoglicosideos",
  "Macrolideos",
  "Tetraciclinas",
  "Nitroimidazois",
  "Polimixinas",
  "Antifungicos",
  "Outros",
] as const;

export const LISTA_ATB: AtbItem[] = [
  { nome: "Ampicilina", classe: "Penicilinas", dose: "2 g 6/6 h IV", diluicao: "Reconstituir conforme bula", renal: "Ajustar se ClCr <10", kw: "listeria enterococcus" },
  { nome: "Amoxicilina-clavulanato", classe: "Penicilinas", dose: "875+125 mg 12/12 h VO", diluicao: "VO", renal: "Evitar se ClCr <30", kw: "sinusite otite" },
  { nome: "Piperacilina-tazobactam", classe: "Penicilinas", dose: "4,5 g 6/6 h IV", diluicao: "100 mL SF 30 min", renal: "Ajustar frequência se IR", kw: "pseudomonas intra-abdominal" },
  { nome: "Ceftriaxona", classe: "Cefalosporinas", dose: "1–2 g/dia IV", diluicao: "SF/ SG 30 min", renal: "Geralmente sem ajuste", kw: "meningite pneumonia gonococo", alerta: "Nunca misturar com solução contendo cálcio" },
  { nome: "Cefepime", classe: "Cefalosporinas", dose: "2 g 8/8 h IV", diluicao: "100 mL 30 min", renal: "Ajustar se ClCr reduzido", kw: "febre neutropenia" },
  { nome: "Meropenem", classe: "Carbapenêmicos", dose: "1 g 8/8 h IV", diluicao: "100 mL 30 min", renal: "Ajustar dose/frequência", kw: "sepse multirresistente" },
  { nome: "Vancomicina", classe: "Glicopeptidos", dose: "15–20 mg/kg 12/12 h", diluicao: "250–500 mL 60–90 min", renal: "Ajustar por nível/ClCr", kw: "mrsa enterococcus", alerta: "Síndrome homem vermelho se infusão rápida" },
  { nome: "Clindamicina", classe: "Lincosamidas", dose: "600–900 mg 8/8 h IV", diluicao: "100 mL 30 min", renal: "Sem ajuste", kw: "pele osso toxina" },
  { nome: "Ciprofloxacino", classe: "Fluoroquinolonas", dose: "400 mg 12/12 h IV", diluicao: "100 mL lento", renal: "Ajustar se ClCr <30", kw: "itú pseudomonas" },
  { nome: "Levofloxacino", classe: "Fluoroquinolonas", dose: "750 mg/dia IV/VO", diluicao: "150 mL 90 min", renal: "Ajustar se ClCr <50", kw: "pneumonia" },
  { nome: "Amicacina", classe: "Aminoglicosideos", dose: "15 mg/kg/dia IV", diluicao: "100 mL 30–60 min", renal: "Intervalo estendido se IR", kw: "gram negativo multirresistente sinergismo tuberculose" },
  { nome: "Gentamicina", classe: "Aminoglicosideos", dose: "5–7 mg/kg/dia IV", diluicao: "100 mL 30 min", renal: "Monitorar função renal", kw: "gram negativo" },
  { nome: "Azitromicina", classe: "Macrolideos", dose: "500 mg/dia IV/VO", diluicao: "500 mL 60 min", renal: "Sem ajuste", kw: "atípica legionella" },
  { nome: "Metronidazol", classe: "Nitroimidazois", dose: "500 mg 8/8 h IV", diluicao: "100 mL 20 min", renal: "Sem ajuste (metabolitos)", kw: "anaeróbios abdome" },
  { nome: "Polimixina B", classe: "Polimixinas", dose: "Conforme bula (mg/kg)", diluicao: "Lenta IV", renal: "Nefrotoxicidade — cautela", kw: "carbapenem resistente" },
  { nome: "Fluconazol", classe: "Antifungicos", dose: "400–800 mg/dia IV/VO", diluicao: "IV lento", renal: "Ajustar se ClCr <50", kw: "candida" },
  { nome: "Anfotericina B lipossomal", classe: "Antifungicos", dose: "3–5 mg/kg/dia IV", diluicao: "Protocolo institucional", renal: "Nefrotoxicidade", kw: "aspergillus" },
  { nome: "Linezolida", classe: "Outros", dose: "600 mg 12/12 h IV/VO", diluicao: "100 mL 30–120 min", renal: "Sem ajuste", kw: "vrsa enterococcus", alerta: "Evitar ISRS/IMAO — serotoninergia" },
  { nome: "Daptomicina", classe: "Outros", dose: "6–10 mg/kg/dia IV", diluicao: "30 min", renal: "Ajustar se ClCr <30", kw: "mrsa bacteremia", alerta: "Não usar em pneumonia (surfactante)" },
  { nome: "Colistina", classe: "Polimixinas", dose: "Carga + manutenção mg/kg", diluicao: "Lenta IV", renal: "Ajustar", kw: "multirresistente" },
  { nome: "Penicilina G cristalina", classe: "Penicilinas", dose: "4 milhões UI 4/4 h IV", diluicao: "SF 30 min", renal: "Ajustar intervalo se IR", kw: "estreptococo meningite" },
  { nome: "Oxacilina", classe: "Penicilinas", dose: "2 g 4/4 h IV", diluicao: "100 mL 30 min", renal: "Sem ajuste usual", kw: "mssa pele" },
  { nome: "Cefazolina", classe: "Cefalosporinas", dose: "2 g 8/8 h IV", diluicao: "100 mL", renal: "Ajustar se ClCr baixo", kw: "profilaxia cirúrgica" },
  { nome: "Ertapenem", classe: "Carbapenêmicos", dose: "1 g/dia IV", diluicao: "100 mL 30 min", renal: "Ajustar se ClCr <30", kw: "intra-abdominal itú" },
  { nome: "Imipenem-cilastatina", classe: "Carbapenêmicos", dose: "500 mg 6/6 h IV", diluicao: "100 mL 30 min", renal: "Ajustar dose/frequência", kw: "polimicrobiano" },
  { nome: "Teicoplanina", classe: "Glicopeptidos", dose: "6–12 mg/kg 12/12 h (carga)", diluicao: "Lenta IV", renal: "Ajustar manutenção", kw: "mrsa coagulase negativo" },
  { nome: "Tigeciclina", classe: "Outros", dose: "100 mg + 50 mg 12/12 h", diluicao: "100 mL 60 min", renal: "Sem ajuste", kw: "intra-abdominal mdr" },
  { nome: "Doxiciclina", classe: "Tetraciclinas", dose: "100 mg 12/12 h VO", diluicao: "VO", renal: "Evitar se IR grave", kw: "atípica rickettsia" },
  { nome: "Sulfametoxazol-trimetoprim", classe: "Outros", dose: "800+160 mg 12/12 h IV/VO", diluicao: "250 mL 60 min", renal: "Ajustar + hidratação", kw: "pneumocystis itú" },
  { nome: "Rifampicina", classe: "Outros", dose: "600 mg/dia VO", diluicao: "VO", renal: "Sem ajuste", kw: "profilaxia meningite tb", alerta: "Interações CYP450" },
  { nome: "Nitrofurantoína", classe: "Outros", dose: "100 mg 6/6 h VO", diluicao: "VO", renal: "Evitar se ClCr <30", kw: "cistite baixa" },
  { nome: "Aciclovir", classe: "Outros", dose: "10 mg/kg 8/8 h IV", diluicao: "250 mL 1 h", renal: "Ajustar hidratação/ClCr", kw: "encefalite herpes" },
  { nome: "Oseltamivir", classe: "Outros", dose: "75 mg 12/12 h VO", diluicao: "VO", renal: "Ajustar se IR", kw: "influenza" },
];

export function filtrarAtb(classe: string, busca: string): AtbItem[] {
  const q = busca.trim().toLowerCase();
  return LISTA_ATB.filter((item) => {
    if (classe !== "Todos" && item.classe !== classe) return false;
    if (!q) return true;
    const hay = `${item.nome} ${item.classe} ${item.kw} ${item.dose}`.toLowerCase();
    return hay.includes(q);
  });
}
