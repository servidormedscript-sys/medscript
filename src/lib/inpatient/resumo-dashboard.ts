import type { LabAlert } from "@/lib/inpatient/lab-alerts";
import type { CriticalLabConduct } from "@/lib/inpatient/lab-critical-conduct";
import {
  getCriticalVitalAlerts,
  getVitalAlertsForRecord,
  type VitalAlert,
} from "@/lib/inpatient/vital-alerts";
import { pickUltimoVital } from "@/lib/inpatient/vital-devices";
import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

export type ResumoAlertGroups = {
  vitalCritical: VitalAlert[];
  vitalRange: VitalAlert[];
  labRange: LabAlert[];
  labTrend: LabAlert[];
  criticalConducts: CriticalLabConduct[];
};

export function buildResumoAlertGroups(input: {
  vitalRecords: EpisodeVitalRecord[];
  birthDate: string | null;
  labAlerts: LabAlert[];
  criticalConducts: CriticalLabConduct[];
}): ResumoAlertGroups {
  const ultimo = pickUltimoVital(input.vitalRecords);
  const vitalCritical = getCriticalVitalAlerts(ultimo);
  const allVital = ultimo
    ? getVitalAlertsForRecord(ultimo, input.birthDate)
    : [];
  const criticalFields = new Set(vitalCritical.map((a) => a.field));
  const vitalRange = allVital.filter((a) => !criticalFields.has(a.field));

  return {
    vitalCritical,
    vitalRange,
    labRange: input.labAlerts.filter((a) => a.kind === "range"),
    labTrend: input.labAlerts.filter((a) => a.kind === "trend"),
    criticalConducts: input.criticalConducts,
  };
}

export function resumoHasActiveAlerts(groups: ResumoAlertGroups): boolean {
  return (
    groups.vitalCritical.length > 0 ||
    groups.vitalRange.length > 0 ||
    groups.labRange.length > 0 ||
    groups.labTrend.length > 0 ||
    groups.criticalConducts.length > 0
  );
}
