export function formatShiftDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShiftTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function formatShiftRange(
  shiftDate: string,
  startTime: string,
  endTime: string
): string {
  return `${formatShiftDate(shiftDate)} · ${formatShiftTime(startTime)} – ${formatShiftTime(endTime)}`;
}
