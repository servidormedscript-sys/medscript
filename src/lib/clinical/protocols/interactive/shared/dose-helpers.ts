export function avisoTetoDose(
  doseCount: number,
  maxDoses: number,
  label: string
): { blocked: boolean; message: string | null } {
  if (doseCount >= maxDoses) {
    return { blocked: true, message: `Teto de ${label} atingido (${maxDoses} doses).` };
  }
  if (doseCount >= maxDoses - 1) {
    return {
      blocked: false,
      message: `Próxima dose será o teto de ${label}.`,
    };
  }
  return { blocked: false, message: null };
}

export function formatTimer(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
