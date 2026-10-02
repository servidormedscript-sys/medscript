import type { VitalRecordInput } from "@/lib/types/inpatient-chart";
import { hasDeviceData, hasNumericVital } from "@/lib/inpatient/vital-devices";
import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

function toNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseVitalRecordInput(
  body: Record<string, unknown>,
): { data: VitalRecordInput } | { error: string } {
  const data: VitalRecordInput = {
    recorded_at:
      typeof body.recorded_at === "string" ? body.recorded_at : undefined,
    pas: toNum(body.pas),
    pad: toNum(body.pad),
    fc: toNum(body.fc),
    fr: toNum(body.fr),
    spo2: toNum(body.spo2),
    temperature: toNum(body.temperature),
    glasgow: toNum(body.glasgow),
    diurese_ml: toNum(body.diurese_ml),
    observation:
      typeof body.observation === "string" ? body.observation.trim() : undefined,
    o2_type:
      typeof body.o2_type === "string"
        ? (body.o2_type as VitalRecordInput["o2_type"])
        : undefined,
    o2_flow_lmin: toNum(body.o2_flow_lmin),
    central_venous_access:
      typeof body.central_venous_access === "boolean"
        ? body.central_venous_access
        : undefined,
    iot: typeof body.iot === "boolean" ? body.iot : undefined,
    monitoring:
      typeof body.monitoring === "boolean" ? body.monitoring : undefined,
    care_location:
      typeof body.care_location === "string"
        ? (body.care_location as VitalRecordInput["care_location"])
        : undefined,
  };

  const draft: EpisodeVitalRecord = {
    id: "draft",
    episode_id: "draft",
    recorded_at: new Date().toISOString(),
    pas: data.pas ?? null,
    pad: data.pad ?? null,
    fc: data.fc ?? null,
    fr: data.fr ?? null,
    spo2: data.spo2 ?? null,
    temperature: data.temperature ?? null,
    glasgow: data.glasgow ?? null,
    diurese_ml: data.diurese_ml ?? null,
    observation: data.observation ?? null,
    o2_type: data.o2_type ?? "ar_ambiente",
    o2_flow_lmin: data.o2_flow_lmin ?? null,
    central_venous_access: data.central_venous_access ?? false,
    iot: data.iot ?? false,
    monitoring: data.monitoring ?? false,
    care_location: data.care_location ?? "enfermaria",
    created_by: null,
    created_at: new Date().toISOString(),
  };

  if (!hasNumericVital(draft) && !hasDeviceData(draft)) {
    return {
      error:
        "Preencha pelo menos um sinal vital ou um dado de dispositivo (além dos padrões).",
    };
  }

  return { data };
}
