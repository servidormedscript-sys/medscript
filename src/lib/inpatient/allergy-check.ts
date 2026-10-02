function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Substring bidirecional normalizada (spec 2.5). */
export function medicationConflictsAllergy(
  medicationName: string,
  allergiesText: string | null | undefined,
): string[] {
  const med = normalize(medicationName);
  if (!med) return [];

  const tokens = (allergiesText ?? "")
    .split(/[,;\n]+/)
    .map((t) => normalize(t))
    .filter((t) => t.length >= 2);

  const hits: string[] = [];
  for (const substance of tokens) {
    if (med.includes(substance) || substance.includes(med)) {
      hits.push(substance);
    }
  }
  return hits;
}

export function findActiveAllergyConflicts(
  allergiesText: string | null | undefined,
  activeMedicationNames: string[],
): { medication: string; substances: string[] }[] {
  const conflicts: { medication: string; substances: string[] }[] = [];
  for (const name of activeMedicationNames) {
    const substances = medicationConflictsAllergy(name, allergiesText);
    if (substances.length) {
      conflicts.push({ medication: name, substances });
    }
  }
  return conflicts;
}
