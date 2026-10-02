import type { EpisodeVitalRecord, O2Type } from "@/lib/types/inpatient-chart";

export const O2_TYPE_LABELS: Record<O2Type, string> = {
  ar_ambiente: "Ar ambiente",
  cateter: "Cateter nasal",
  maf: "Máscara de alto fluxo",
  vni: "VNI",
  vm: "Ventilação mecânica-IOT",
};

export const CARE_LOCATION_LABELS: Record<
  EpisodeVitalRecord["care_location"],
  string
> = {
  enfermaria: "Enfermaria",
  emergencia: "Emergência",
  uti: "UTI",
};

export function hasNumericVital(record: EpisodeVitalRecord): boolean {
  return (
    record.pas != null ||
    record.pad != null ||
    record.fc != null ||
    record.fr != null ||
    record.spo2 != null ||
    record.temperature != null ||
    record.glasgow != null ||
    record.diurese_ml != null
  );
}

/** Dispositivo considerado preenchido (ignora defaults ar ambiente + enfermaria). */
export function hasDeviceData(record: EpisodeVitalRecord): boolean {
  if (record.o2_type !== "ar_ambiente") return true;
  if (record.o2_flow_lmin != null && record.o2_flow_lmin > 0) return true;
  if (record.central_venous_access) return true;
  if (record.iot) return true;
  if (record.monitoring) return true;
  if (record.care_location !== "enfermaria") return true;
  return false;
}

export function recordHasSaveableData(record: EpisodeVitalRecord): boolean {
  return hasNumericVital(record) || hasDeviceData(record);
}

export function pickUltimoVital(
  records: EpisodeVitalRecord[],
): EpisodeVitalRecord | null {
  for (const r of records) {
    if (hasNumericVital(r)) return r;
  }
  return null;
}

export function pickUltimoComDispositivo(
  records: EpisodeVitalRecord[],
): EpisodeVitalRecord | null {
  for (const r of records) {
    if (hasDeviceData(r)) return r;
  }
  return null;
}

export function summarizeDevices(record: EpisodeVitalRecord | null): string {
  if (!record) return "—";
  const parts: string[] = [O2_TYPE_LABELS[record.o2_type]];
  if (
    record.o2_flow_lmin != null &&
    record.o2_flow_lmin > 0 &&
    (record.o2_type === "cateter" || record.o2_type === "maf")
  ) {
    parts.push(`${record.o2_flow_lmin} L/min`);
  }
  if (record.central_venous_access) parts.push("AVC");
  if (record.iot) parts.push("IOT");
  if (record.monitoring) parts.push("Monitorização");
  parts.push(CARE_LOCATION_LABELS[record.care_location]);
  return parts.join(" · ");
}

export function summarizeVitals(record: EpisodeVitalRecord | null): string {
  if (!record) return "—";
  const parts: string[] = [];
  if (record.pas != null && record.pad != null) {
    parts.push(`PA ${record.pas}/${record.pad} mmHg`);
  } else if (record.pas != null) {
    parts.push(`PAS ${record.pas} mmHg`);
  } else if (record.pad != null) {
    parts.push(`PAD ${record.pad} mmHg`);
  }
  if (record.fc != null) parts.push(`FC ${record.fc} bpm`);
  if (record.fr != null) parts.push(`FR ${record.fr} irpm`);
  if (record.spo2 != null) parts.push(`SpO₂ ${record.spo2}%`);
  if (record.temperature != null) parts.push(`Tax ${record.temperature} °C`);
  if (record.glasgow != null) parts.push(`Glasgow ${record.glasgow}`);
  if (record.diurese_ml != null) parts.push(`Diurese ${record.diurese_ml} mL`);
  return parts.length ? parts.join(" · ") : "—";
}
