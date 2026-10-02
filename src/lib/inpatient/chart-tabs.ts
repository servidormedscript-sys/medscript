export const INPATIENT_CHART_TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "vitais", label: "Sinais Vitais" },
  { id: "exame-fisico", label: "Exame Físico" },
  { id: "evolucao", label: "Evolução" },
  { id: "exames", label: "Exames" },
  { id: "prescricao", label: "Prescrição" },
  { id: "conduta", label: "Conduta" },
  { id: "aih", label: "AIH/Internação" },
  { id: "alta", label: "Alta" },
] as const;

export type InpatientChartTabId = (typeof INPATIENT_CHART_TABS)[number]["id"];

export function isInpatientChartTabId(value: string): value is InpatientChartTabId {
  return INPATIENT_CHART_TABS.some((t) => t.id === value);
}
