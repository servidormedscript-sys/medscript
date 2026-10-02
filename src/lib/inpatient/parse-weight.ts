export function parseWeightKg(weight: string | null | undefined): number | null {
  if (!weight?.trim()) return null;
  const n = parseFloat(weight.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
