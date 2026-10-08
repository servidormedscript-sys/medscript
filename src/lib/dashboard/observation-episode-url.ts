export function observationEpisodeUrl(episodeId: string): string {
  return `/dashboard/pacientes/${encodeURIComponent(episodeId)}/observacao`;
}
