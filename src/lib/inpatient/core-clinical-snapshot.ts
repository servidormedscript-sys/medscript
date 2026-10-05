import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { getCriticalVitalAlerts } from "@/lib/inpatient/vital-alerts";
import {
  pickUltimoComDispositivo,
  pickUltimoVital,
} from "@/lib/inpatient/vital-devices";
import type { EpisodeLabValue, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

export type CoreClinicalSnapshot = {
  recordedAt: string;
  pas: number | null;
  pad: number | null;
  fc: number | null;
  fr: number | null;
  spo2: number | null;
  temperature: number | null;
  glasgow: number | null;
  o2_type: string | null;
  o2_flow_lmin: number | null;
  iot: boolean;
  central_venous_access: boolean;
  lab_alert_keys: string[];
  vital_alert_messages: string[];
};

export function buildCoreClinicalSnapshot(input: {
  vitalRecords: EpisodeVitalRecord[];
  labValues: EpisodeLabValue[];
}): CoreClinicalSnapshot {
  const ultimo = pickUltimoVital(input.vitalRecords);
  const device = pickUltimoComDispositivo(input.vitalRecords);
  const labAlerts = computeLabAlerts(input.labValues);
  const vitalAlerts = getCriticalVitalAlerts(ultimo);

  return {
    recordedAt: ultimo?.recorded_at ?? new Date().toISOString(),
    pas: ultimo?.pas ?? null,
    pad: ultimo?.pad ?? null,
    fc: ultimo?.fc ?? null,
    fr: ultimo?.fr ?? null,
    spo2: ultimo?.spo2 ?? null,
    temperature: ultimo?.temperature ?? null,
    glasgow: ultimo?.glasgow ?? null,
    o2_type: device?.o2_type ?? null,
    o2_flow_lmin: device?.o2_flow_lmin ?? null,
    iot: Boolean(device?.iot),
    central_venous_access: Boolean(device?.central_venous_access),
    lab_alert_keys: labAlerts.map((a) => a.analyteKey),
    vital_alert_messages: vitalAlerts.map((a) => a.message),
  };
}

function fmt(n: number | null, suffix = ""): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n}${suffix}`;
}

function trendVital(
  label: string,
  before: number | null,
  after: number | null,
  worseIfHigher: boolean,
): string | null {
  if (before == null && after == null) return null;
  if (before === after) return null;
  let tag = "";
  if (before != null && after != null) {
    if (after > before) tag = worseIfHigher ? " ↑ pior" : " ↑";
    else if (after < before) tag = worseIfHigher ? " ↓" : " ↓ pior";
  }
  return `${label}: ${fmt(before)} → ${fmt(after)}${tag}`;
}

export function compareCoreClinicalSnapshots(
  before: CoreClinicalSnapshot,
  after: CoreClinicalSnapshot,
): string[] {
  const lines: string[] = [];

  const vitals = [
    trendVital("PAS", before.pas, after.pas, false),
    trendVital("PAD", before.pad, after.pad, false),
    trendVital("FC", before.fc, after.fc, true),
    trendVital("FR", before.fr, after.fr, true),
    trendVital("SpO₂", before.spo2, after.spo2, false),
    trendVital("Tax", before.temperature, after.temperature, true),
    trendVital("Glasgow", before.glasgow, after.glasgow, false),
  ];
  for (const v of vitals) {
    if (v) lines.push(v);
  }

  if (before.o2_type !== after.o2_type) {
    lines.push(
      `Oxigênio: ${before.o2_type ?? "—"} → ${after.o2_type ?? "—"}`,
    );
  }
  if (before.o2_flow_lmin !== after.o2_flow_lmin) {
    lines.push(
      `Fluxo O₂: ${fmt(before.o2_flow_lmin, " L/min")} → ${fmt(after.o2_flow_lmin, " L/min")}`,
    );
  }
  if (before.iot !== after.iot) {
    lines.push(after.iot ? "IOT: não → sim" : "IOT: sim → não");
  }

  const beforeLabs = new Set(before.lab_alert_keys);
  const afterLabs = new Set(after.lab_alert_keys);
  for (const k of afterLabs) {
    if (!beforeLabs.has(k)) lines.push(`Novo alerta laboratorial: ${k}`);
  }
  for (const k of beforeLabs) {
    if (!afterLabs.has(k)) lines.push(`Alerta laboratorial resolvido: ${k}`);
  }

  const beforeV = new Set(before.vital_alert_messages);
  const afterV = new Set(after.vital_alert_messages);
  for (const m of afterV) {
    if (!beforeV.has(m)) lines.push(`Novo alerta de vital: ${m}`);
  }

  const vitalWorse = lines.some((l) => l.includes("pior"));
  const newLab = [...afterLabs].some((k) => !beforeLabs.has(k));
  if (vitalWorse || newLab) {
    lines.push(
      "Veredito: há achados objetivos em piora — não assumir melhora só pela evolução subjetiva.",
    );
  } else if (lines.length > 0) {
    lines.push("Veredito: mudanças registradas — revisar no contexto clínico.");
  } else {
    lines.push("Veredito: sem mudanças objetivas relevantes desde a referência.");
  }

  return lines;
}

export function parseCoreClinicalSnapshot(
  raw: unknown,
): CoreClinicalSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    recordedAt: String(o.recordedAt ?? ""),
    pas: o.pas != null ? Number(o.pas) : null,
    pad: o.pad != null ? Number(o.pad) : null,
    fc: o.fc != null ? Number(o.fc) : null,
    fr: o.fr != null ? Number(o.fr) : null,
    spo2: o.spo2 != null ? Number(o.spo2) : null,
    temperature: o.temperature != null ? Number(o.temperature) : null,
    glasgow: o.glasgow != null ? Number(o.glasgow) : null,
    o2_type: o.o2_type != null ? String(o.o2_type) : null,
    o2_flow_lmin:
      o.o2_flow_lmin != null ? Number(o.o2_flow_lmin) : null,
    iot: Boolean(o.iot),
    central_venous_access: Boolean(o.central_venous_access),
    lab_alert_keys: Array.isArray(o.lab_alert_keys)
      ? o.lab_alert_keys.map(String)
      : [],
    vital_alert_messages: Array.isArray(o.vital_alert_messages)
      ? o.vital_alert_messages.map(String)
      : [],
  };
}
