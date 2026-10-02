export function hoursSinceLastEvolution(
  evolutionTimestamps: string[],
  admissionAt: string,
): number {
  const sorted = [...evolutionTimestamps].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  const ref = sorted[0] ? new Date(sorted[0]) : new Date(admissionAt);
  return (Date.now() - ref.getTime()) / (1000 * 60 * 60);
}
