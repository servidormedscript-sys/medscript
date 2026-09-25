export type HemoTab = "indicacoes" | "antes" | "durante" | "reacoes";

export const HEMO_TABS: { id: HemoTab; label: string }[] = [
  { id: "indicacoes", label: "Indicações" },
  { id: "antes", label: "Antes" },
  { id: "durante", label: "Durante" },
  { id: "reacoes", label: "Reações" },
];

export type TransfusionReactionId =
  | "anafilatica"
  | "hemolitica-aguda-abo"
  | "trali"
  | "sepse-contaminacao"
  | "rfnh"
  | "alergica"
  | "taco"
  | "hemolitica-tardia"
  | "citrato";

export type TransfusionReaction = {
  id: TransfusionReactionId;
  name: string;
  grave: boolean;
  presentation: string;
  conduct: string[];
  /** Diferenciação clínica (ex.: TACO vs TRALI) */
  differentiate?: string;
};

export const TRANSFUSION_REACTIONS: TransfusionReaction[] = [
  {
    id: "anafilatica",
    name: "Reação anafilática",
    grave: true,
    presentation: "Broncoespasmo, estridor, hipotensão, urticária, angioedema — início rápido.",
    conduct: [
      "Interromper transfusão imediatamente; manter acesso com SF.",
      "Adrenalina IM sem atraso (repetir conforme resposta).",
      "Oxigênio, expansão volêmica, anti-histamínico e corticoide conforme protocolo.",
      "Notificar banco de sangue e registrar lote/unidade.",
    ],
  },
  {
    id: "hemolitica-aguda-abo",
    name: "Hemólise aguda por incompatibilidade ABO",
    grave: true,
    presentation: "Febre, calafrios, dor lombar/flanco, hipotensão, hemoglobinúria, coagulopatia.",
    conduct: [
      "Parar transfusão; manter acesso com SF.",
      "Reconferir identificação paciente × bolsa × tipagem e prova.",
      "Suporte hemodinâmico; diurese alcalina se indicado; notificar hemoterapia.",
      "Coletar amostras para investigação (tipagem, Coombs, Hb livre, função renal).",
    ],
  },
  {
    id: "trali",
    name: "TRALI",
    grave: true,
    presentation: "Dispneia, hipoxemia, infiltrado bilateral — hipotensão comum; sem sinais de sobrecarga volêmica.",
    differentiate:
      "TRALI: hipotensão + infiltrado bilateral sem sobrecarga hídrica. Diferente da TACO (hipertensão, congestão, boa resposta a diurético).",
    conduct: [
      "Interromper transfusão; oxigênio e suporte ventilatório.",
      "Evitar fluidos em excesso; manejo em UTI se necessário.",
      "Notificar banco de sangue (investigação de anticorpos no doador).",
    ],
  },
  {
    id: "sepse-contaminacao",
    name: "Sepse / contaminação bacteriana",
    grave: true,
    presentation: "Febre alta, hipotensão, calafrios, choque — início durante ou logo após.",
    conduct: [
      "Parar transfusão; hemoculturas (paciente e produto).",
      "Antibioticoterapia empírica de amplo espectro sem atraso.",
      "Suporte hemodinâmico e UTI; notificar hemoterapia.",
    ],
  },
  {
    id: "rfnh",
    name: "Reação febril não hemolítica (RFNH)",
    grave: false,
    presentation: "Febre e calafrios sem hemólise ou instabilidade.",
    conduct: [
      "Desacelerar ou interromper conforme gravidade; antitérmico.",
      "Descartar hemólise e sepse; retomar se estável e investigação ok.",
    ],
  },
  {
    id: "alergica",
    name: "Reação alérgica leve",
    grave: false,
    presentation: "Urticária, prurido, sem broncoespasmo ou hipotensão.",
    conduct: [
      "Desacelerar ou pausar; anti-histamínico.",
      "Se progressão para anafilaxia → protocolo de reação grave.",
    ],
  },
  {
    id: "taco",
    name: "TACO (sobrecarga circulatória)",
    grave: false,
    presentation: "Dispneia, hipertensão, estertores, turgência jugular — boa resposta a diurético.",
    differentiate:
      "TACO: hipertensão + sinais de congestão com melhora após furosemida. TRALI: hipotensão + infiltrado sem sobrecarga.",
    conduct: [
      "Interromper ou desacelerar transfusão; oxigênio.",
      "Furosemida IV conforme perfil hemodinâmico.",
      "Reavaliar indicação e velocidade de infusão em futuras bolsas.",
    ],
  },
  {
    id: "hemolitica-tardia",
    name: "Hemólise tardia",
    grave: false,
    presentation: "Queda de Hb dias após transfusão; icterícia; Coombs positivo tardio.",
    conduct: [
      "Confirmar com laboratório e hemoterapia.",
      "Suporte clínico; evitar reexposição a antígeno implicado.",
    ],
  },
  {
    id: "citrato",
    name: "Intoxicação por citrato",
    grave: false,
    presentation: "Hipocalcemia (parestesias, QT longo), especialmente em transfusão maciça ou hepática.",
    conduct: [
      "Desacelerar transfusão; cálcio IV se sintomático (monitorar ECG).",
      "Aquecer sangue se hipotermia contribuinte.",
    ],
  },
];

export const HEMO_TAB_CONTENT: Record<
  Exclude<HemoTab, "reacoes">,
  { title: string; items: string[] }
> = {
  indicacoes: {
    title: "Indicações de hemocomponentes (referência)",
    items: [
      "Concentrado de hemácias: Hb < 7 g/dL (ou < 8 g/dL com cardiopatia/instabilidade) ou sangramento com instabilidade.",
      "Plasma fresco: coagulopatia com sangramento e deficiência de fatores (ex.: CIVD, reversão warfarina com sangramento).",
      "Plaquetas: sangramento com trombocitopenia < 50.000 (ou < 100.000 em neurocirurgia/oftálmica) ou plaquetopenia grave sem sangramento conforme protocolo.",
      "Crioprecipitado: hipofibrinogenemia < 100–150 mg/dL com sangramento ou fibrinogênio consumido.",
      "Transfusão maciça: protocolo institucional (ex.: 1:1:1 CH:plasma:plaquetas) em hemorragia exsanguinante.",
      "Sempre reavaliar clinicamente — não transfundir só por número isolado de Hb.",
    ],
  },
  antes: {
    title: "Antes da transfusão",
    items: [
      "Confirmar indicação, consentimento e plano de componente.",
      "Tipagem ABO/Rh e prova de compatibilidade (Coombs) — dupla checagem.",
      "Identificação do paciente (pulseira) × bolsa × prescrição — dois profissionais se possível.",
      "Acesso venoso calibroso; filtro de sangue; bomba se disponível.",
      "Registrar lote, validade e horário de início previsto.",
    ],
  },
  durante: {
    title: "Durante a transfusão",
    items: [
      "Vital signs no início, 15 min e depois conforme gravidade.",
      "Velocidade: em geral 1ª hora mais lenta; ajustar a tolerância e indicação.",
      "Não administrar medicamentos na mesma linha do hemocomponente.",
      "Permanecer com paciente observável nos primeiros 15 min (maior risco de reação grave).",
      "Interromper imediatamente se qualquer sinal de reação — manter acesso com SF e abrir aba Reações.",
    ],
  },
};

export function getReactionById(id: TransfusionReactionId): TransfusionReaction | undefined {
  return TRANSFUSION_REACTIONS.find((r) => r.id === id);
}
