export function calculateAge(birthDate: string): {
  years: number;
  months: number;
} | null {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birth.getTime()) || birth > today) return null;

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months };
}

export function formatAge(birthDate: string): string | null {
  const age = calculateAge(birthDate);
  if (!age) return null;

  const yearLabel = age.years === 1 ? "ano" : "anos";
  const monthLabel = age.months === 1 ? "mês" : "meses";

  if (age.years === 0) {
    return `${age.months} ${monthLabel}`;
  }

  if (age.months === 0) {
    return `${age.years} ${yearLabel}`;
  }

  return `${age.years} ${yearLabel} e ${age.months} ${monthLabel}`;
}
