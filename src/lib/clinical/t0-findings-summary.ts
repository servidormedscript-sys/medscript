import {
  COMPLEMENTARY_SECTIONS,
  EXAM_SECTIONS,
} from "@/lib/clinical/t0-form-config";

export function summarizeT0PositiveFindings(
  findings: Record<string, boolean>,
  complementary: Record<string, boolean>,
): string {
  const labels: string[] = [];
  for (const section of EXAM_SECTIONS) {
    for (const item of section.items) {
      if (findings[item.id]) labels.push(item.label);
    }
  }
  for (const section of COMPLEMENTARY_SECTIONS) {
    for (const item of section.items) {
      if (complementary[item.id]) labels.push(item.label);
    }
  }
  return labels.join("; ");
}
