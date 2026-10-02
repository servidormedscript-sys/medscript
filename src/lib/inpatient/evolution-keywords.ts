export type EvolutionKeywordSuggestion = {
  id: string;
  triggerLabel: string;
  suggestionHtml: string;
  medications: { name: string; detail: string }[];
  warning?: string;
  /** Link interno para ferramenta/protocolo relacionado. */
  protocolHref?: string;
  protocolLinkLabel?: string;
};

export const DRIP_CALCULATOR_PROTOCOL_HREF =
  "/dashboard/protocolos-clinicos?protocol=calculadora-gotejamento";

const DISCLAIMER =
  "Detectado pelo texto da evolução — sugestão por palavra-chave, revise antes de usar.";

const RULES: {
  id: string;
  pattern: RegExp;
  triggerLabel: string;
  suggestion: string;
  medications: { name: string; detail: string }[];
  warning?: string;
  protocolHref?: string;
  protocolLinkLabel?: string;
}[] = [
  {
    id: "hipotensao",
    pattern: /\b(hipotens[aã]o|choque)\b/i,
    triggerLabel: "Hipotensão / choque",
    suggestion:
      "Noradrenalina 0,05–1,0 mcg/kg/min titulada pela PAM — use a calculadora de gotejamento.",
    protocolHref: DRIP_CALCULATOR_PROTOCOL_HREF,
    protocolLinkLabel: "Abrir calculadora de gotejamento",
    medications: [
      {
        name: "Noradrenalina",
        detail: "0,05–1,0 mcg/kg/min EV — titular pela PAM",
      },
    ],
  },
  {
    id: "hipoxemia",
    pattern: /\b(dessatura[cç][aã]o|hipoxemia|hipoxia)\b/i,
    triggerLabel: "Dessaturação / hipoxemia",
    suggestion:
      "O₂ suplementar, meta SpO₂ 94–98% (88–92% se risco de retenção de CO₂).",
    medications: [],
  },
  {
    id: "agitacao",
    pattern: /\bagita[cç][aã]o psicomotora\b/i,
    triggerLabel: "Agitação psicomotora",
    suggestion: "Haloperidol + Prometazina 5mg+50mg IM dose única.",
    warning: "Evitar benzodiazepínico IM + olanzapina IM juntos.",
    medications: [
      { name: "Haloperidol", detail: "5mg IM dose única" },
      { name: "Prometazina", detail: "50mg IM dose única" },
    ],
  },
  {
    id: "convulsao",
    pattern: /\b(crise convulsiva ativa|convuls[aã]o ativa|status epilepticus)\b/i,
    triggerLabel: "Crise convulsiva ativa",
    suggestion:
      "Diazepam 10mg (0,2mg/kg, máx 10mg) EV lento, repetir 1x em 5min se persistir.",
    medications: [
      {
        name: "Diazepam",
        detail: "10mg (0,2mg/kg, máx 10mg) EV lento — repetir 1x em 5min",
      },
    ],
  },
  {
    id: "fa",
    pattern: /\b(fibrila[cç][aã]o atrial|fa de in[ií]cio)\b/i,
    triggerLabel: "Fibrilação atrial de início",
    suggestion:
      "Antes de cardioverter, se FA>48h ou tempo indeterminado: Enoxaparina 1mg/kg SC 12/12h.",
    medications: [
      { name: "Enoxaparina", detail: "1mg/kg SC 12/12h" },
    ],
  },
];

export function detectEvolutionKeywordSuggestions(
  plainText: string,
): EvolutionKeywordSuggestion[] {
  const normalized = plainText.trim();
  if (!normalized) return [];

  const out: EvolutionKeywordSuggestion[] = [];
  for (const rule of RULES) {
    if (!rule.pattern.test(normalized)) continue;
    out.push({
      id: rule.id,
      triggerLabel: rule.triggerLabel,
      suggestionHtml: `<p>${rule.suggestion}</p>`,
      medications: rule.medications,
      warning: rule.warning,
      protocolHref: rule.protocolHref,
      protocolLinkLabel: rule.protocolLinkLabel,
    });
  }
  return out;
}

export function keywordSuggestionDisclaimer(): string {
  return DISCLAIMER;
}
