import { getAnalyte } from "@/lib/inpatient/lab-analytes";
import type { EpisodeLabValue } from "@/lib/types/inpatient-chart";

export function groupLabValuesByDay(
  values: EpisodeLabValue[],
): Map<string, EpisodeLabValue[]> {
  const map = new Map<string, EpisodeLabValue[]>();
  for (const v of values) {
    const day = new Date(v.collected_at).toLocaleDateString("pt-BR");
    const list = map.get(day) ?? [];
    list.push(v);
    map.set(day, list);
  }
  return map;
}

export function formatLabDayLines(values: EpisodeLabValue[]): string[] {
  const byDay = groupLabValuesByDay(values);
  const days = [...byDay.keys()].sort((a, b) => {
    const da = a.split("/").reverse().join("-");
    const db = b.split("/").reverse().join("-");
    return db.localeCompare(da);
  });
  return days.map((day) => {
    const items = byDay.get(day) ?? [];
    const parts = items.map((v) => {
      const def = getAnalyte(v.analyte_key);
      const label = def?.label ?? v.analyte_key;
      const unit = def?.unit ? ` ${def.unit}` : "";
      return `${label} ${v.value}${unit}`;
    });
    return `${day}: ${parts.join(" | ")}`;
  });
}
