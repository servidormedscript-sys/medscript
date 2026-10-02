export const COMORBIDITY_ITEMS = [
  { id: "has", label: "HAS" },
  { id: "dm", label: "DM" },
  { id: "dislipidemia", label: "Dislipidemia" },
  { id: "obesidade", label: "Obesidade" },
  { id: "ic", label: "IC" },
  { id: "iam_dac", label: "IAM prévio / DAC" },
  { id: "avc_previo", label: "AVC prévio" },
  { id: "dpoc", label: "DPOC" },
  { id: "asma", label: "Asma" },
  { id: "drc", label: "DRC" },
  { id: "neoplasia", label: "Neoplasia ativa/tratada" },
  { id: "tabagismo", label: "Tabagismo" },
  { id: "etilismo", label: "Etilismo" },
] as const;

export type ComorbidityFlags = Record<string, boolean>;

export function comorbidityLabels(flags: ComorbidityFlags): string[] {
  return COMORBIDITY_ITEMS.filter((i) => flags[i.id]).map((i) => i.label);
}

export function emptyEpisodeComorbidities(episodeId: string) {
  return {
    episode_id: episodeId,
    flags: {} as ComorbidityFlags,
    other_text: "",
    problems_seeded: false,
    updated_at: new Date().toISOString(),
  };
}
