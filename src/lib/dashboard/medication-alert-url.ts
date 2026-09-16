export function patientResumoUrl(episodeId: string) {
  const params = new URLSearchParams({
    tab: "resumo",
    episode: episodeId,
  });
  return `/dashboard/relatorio-pacientes?${params.toString()}`;
}
