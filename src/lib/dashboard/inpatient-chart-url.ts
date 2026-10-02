export function inpatientChartUrl(
  episodeId: string,
  tab?: string,
): string {
  const base = `/dashboard/pacientes/${encodeURIComponent(episodeId)}/prontuario`;
  if (!tab) return base;
  return `${base}?tab=${encodeURIComponent(tab)}`;
}
