export function parseShiftTimeToMinutes(timeStr: string) {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0) + (seconds || 0) / 60;
}

export function calculateShiftHours(startTime: string, endTime: string) {
  let start = parseShiftTimeToMinutes(startTime);
  let end = parseShiftTimeToMinutes(endTime);

  if (end <= start) {
    end += 24 * 60;
  }

  return (end - start) / 60;
}

export function formatShiftHours(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}min`;
}

export function getMonthDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  return { startDate, endDate };
}

export function parseMonthYear(
  monthParam: string | null,
  yearParam: string | null,
  fallback = new Date(),
) {
  const month = monthParam ? Number(monthParam) : fallback.getMonth() + 1;
  const year = yearParam ? Number(yearParam) : fallback.getFullYear();

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }

  return { month, year };
}

export const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function getMonthLabel(month: number) {
  return MONTH_LABELS[month - 1] ?? String(month);
}
