import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import type { CodeStatus } from "@/lib/types/inpatient-chart";
import type { EpisodeLabValue, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";
import type { RiskLevel } from "@/lib/types/patient";
import { pickUltimoComDispositivo } from "@/lib/inpatient/vital-devices";

export type DischargePrediction = {
  suppressed: boolean;
  suppressedReason?: string;
  minDays: number;
  maxDays: number;
  factors: { label: string; deltaDays: number }[];
  disclaimer: string;
};

const DISCLAIMER =
  "Estimativa por regras clínicas simples — não é uma previsão de IA nem substitui o julgamento médico. Ajuste com base no quadro real do paciente.";

const DIAGNOSIS_BASE_DAYS: { pattern: RegExp; days: number }[] = [
  { pattern: /pneumonia|pac/i, days: 5 },
  { pattern: /itu|pielonefrite/i, days: 7 },
  { pattern: /sepse|choque/i, days: 8 },
  { pattern: /icc|insuficiência cardíaca/i, days: 6 },
  { pattern: /avc/i, days: 7 },
  { pattern: /tep|embolia/i, days: 5 },
  { pattern: /dpoc/i, days: 5 },
  { pattern: /pancreatite/i, days: 6 },
];

function baseDaysFromDiagnosis(diagnosis: string | null): number {
  const d = diagnosis?.trim() ?? "";
  for (const row of DIAGNOSIS_BASE_DAYS) {
    if (row.pattern.test(d)) return row.days;
  }
  return 5;
}

function hasInvasiveDevice(record: EpisodeVitalRecord | null): boolean {
  if (!record) return false;
  if (record.iot) return true;
  if (record.central_venous_access) return true;
  const o2 = record.o2_type;
  return o2 === "maf" || o2 === "vni" || o2 === "vm";
}

function labTrendNetDelta(values: EpisodeLabValue[]): number {
  const alerts = computeLabAlerts(values);
  let delta = 0;
  for (const a of alerts) {
    if (a.kind !== "trend") continue;
    if (a.message.includes("elevação") || a.message.includes("queda")) {
      delta += 1;
    }
    if (a.message.includes("melhorando")) delta -= 1;
  }
  return Math.max(-1, Math.min(1, delta));
}

export function computeDischargePrediction(input: {
  clinicalStatus: ClinicalStatusResult;
  labValues: EpisodeLabValue[];
  vitalRecords: EpisodeVitalRecord[];
  diagnosis: string | null;
  codeStatus?: CodeStatus | null;
  activeLabAlertCount: number;
}): DischargePrediction {
  if (input.codeStatus && input.codeStatus !== "reanimacao_plena") {
    return {
      suppressed: true,
      suppressedReason: "Acompanhamento individualizado (status de código ≠ reanimação plena).",
      minDays: 0,
      maxDays: 0,
      factors: [],
      disclaimer: DISCLAIMER,
    };
  }

  let days = baseDaysFromDiagnosis(input.diagnosis);
  const factors: { label: string; deltaDays: number }[] = [
    {
      label: `Referência por diagnóstico (~${baseDaysFromDiagnosis(input.diagnosis)} dias)`,
      deltaDays: 0,
    },
  ];

  const met = input.clinicalStatus.discharge.met;
  const criteriaDelta = -met;
  if (criteriaDelta !== 0) {
    days += criteriaDelta;
    factors.push({
      label: `Critérios de alta ${met}/4`,
      deltaDays: criteriaDelta,
    });
  }

  const riskDelta: Record<RiskLevel, number> = {
    alto: 3,
    medio: 1,
    baixo: 0,
  };
  const rd = riskDelta[input.clinicalStatus.risk];
  if (rd) {
    days += rd;
    factors.push({
      label: `Risco ${input.clinicalStatus.risk}`,
      deltaDays: rd,
    });
  }

  const alertDelta = input.activeLabAlertCount * 0.5;
  if (alertDelta > 0) {
    days += alertDelta;
    factors.push({
      label: `${input.activeLabAlertCount} alerta(s) de exame ativo(s)`,
      deltaDays: alertDelta,
    });
  }

  const trendDelta = labTrendNetDelta(input.labValues);
  if (trendDelta !== 0) {
    days += trendDelta;
    factors.push({
      label: trendDelta > 0 ? "Tendência de exames piorando" : "Tendência favorável",
      deltaDays: trendDelta,
    });
  }

  const deviceRecord = pickUltimoComDispositivo(input.vitalRecords);
  if (hasInvasiveDevice(deviceRecord)) {
    days += 2;
    factors.push({
      label: "Dispositivo invasivo / O₂ alto fluxo ou VM",
      deltaDays: 2,
    });
  }

  const center = Math.max(1, Math.round(days));
  const minDays = Math.max(1, center - 1);
  const maxDays = center + 1;

  return {
    suppressed: false,
    minDays,
    maxDays,
    factors,
    disclaimer: DISCLAIMER,
  };
}
