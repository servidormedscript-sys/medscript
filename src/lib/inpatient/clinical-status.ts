import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { hoursSinceLastEvolution } from "@/lib/inpatient/evolution-delay";
import {
  getCriticalVitalAlerts,
  getVitalAlertsForRecord,
} from "@/lib/inpatient/vital-alerts";
import { pickUltimoVital } from "@/lib/inpatient/vital-devices";
import type { EpisodeLabValue, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";
import type { RiskLevel } from "@/lib/types/patient";

export type DischargeCriterionId =
  | "vitals_normal"
  | "afebril"
  | "no_lab_alerts"
  | "evolution_24h";

export type DischargeCriterion = {
  id: DischargeCriterionId;
  label: string;
  met: boolean;
  detail: string;
};

export type ClinicalStatusResult = {
  risk: RiskLevel;
  riskReasons: string[];
  evolutionDelayHours: number;
  evolutionDelayAlert: "none" | "medium" | "high";
  discharge: {
    met: number;
    total: 4;
    criteria: DischargeCriterion[];
    disclaimer: string;
  };
};

const DISCHARGE_DISCLAIMER =
  "Sugestão por regras simples — não substitui julgamento clínico.";

function latestLabValue(
  values: EpisodeLabValue[],
  key: string,
): number | null {
  const row = values
    .filter((v) => v.analyte_key === key)
    .sort(
      (a, b) =>
        new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
    )[0];
  return row?.value ?? null;
}

function hasCriticalExam(values: EpisodeLabValue[]): boolean {
  const lactato = latestLabValue(values, "lactato");
  const plaquetas = latestLabValue(values, "plaquetas");
  if (lactato != null && lactato > 4) return true;
  if (plaquetas != null && plaquetas < 50_000) return true;
  return false;
}

export function computeClinicalStatus(input: {
  vitalRecords: EpisodeVitalRecord[];
  labValues: EpisodeLabValue[];
  evolutionTimestamps: string[];
  admissionAt: string;
  birthDate: string | null;
}): ClinicalStatusResult {
  const vitals = input.vitalRecords;
  const ultimoVital = pickUltimoVital(vitals);
  const evolutionDelayHours = hoursSinceLastEvolution(
    input.evolutionTimestamps,
    input.admissionAt,
  );

  let evolutionDelayAlert: ClinicalStatusResult["evolutionDelayAlert"] = "none";
  if (evolutionDelayHours >= 24) evolutionDelayAlert = "high";
  else if (evolutionDelayHours >= 12) evolutionDelayAlert = "medium";

  const riskReasons: string[] = [];
  let risk: RiskLevel = "baixo";

  const criticalVitals = getCriticalVitalAlerts(ultimoVital);
  if (criticalVitals.length > 0) {
    for (const a of criticalVitals) riskReasons.push(a.message);
  }

  if (hasCriticalExam(input.labValues)) {
    const lac = latestLabValue(input.labValues, "lactato");
    const plt = latestLabValue(input.labValues, "plaquetas");
    if (lac != null && lac > 4) {
      riskReasons.push(`Lactato crítico (${lac} mmol/L)`);
    }
    if (plt != null && plt < 50_000) {
      riskReasons.push(`Plaquetas críticas (${plt} /mm³)`);
    }
  }

  if (evolutionDelayHours >= 24) {
    riskReasons.push(
      `Evolução atrasada (≥24h — última há ${Math.floor(evolutionDelayHours)}h)`,
    );
  }

  if (
    criticalVitals.length > 0 ||
    hasCriticalExam(input.labValues) ||
    evolutionDelayHours >= 24
  ) {
    risk = "alto";
  } else {
    const rangeVital =
      ultimoVital &&
      getVitalAlertsForRecord(ultimoVital, input.birthDate).length > 0;
    const labAlerts = computeLabAlerts(input.labValues);
    if (rangeVital) {
      for (const a of getVitalAlertsForRecord(ultimoVital!, input.birthDate)) {
        riskReasons.push(a.message);
      }
    }
    for (const a of labAlerts) {
      riskReasons.push(a.message);
    }
    if (rangeVital || labAlerts.length > 0 || evolutionDelayHours >= 12) {
      risk = "medio";
      if (evolutionDelayHours >= 12 && evolutionDelayHours < 24) {
        riskReasons.push(
          `Evolução atrasada (≥12h — última há ${Math.floor(evolutionDelayHours)}h)`,
        );
      }
    }
  }

  const vitalRangeAlerts =
    ultimoVital && getVitalAlertsForRecord(ultimoVital, input.birthDate);
  const vitalsNormal =
    ultimoVital != null &&
    pickUltimoVital(vitals) != null &&
    (vitalRangeAlerts?.length ?? 0) === 0 &&
    criticalVitals.length === 0;

  const afebril =
    ultimoVital?.temperature != null && ultimoVital.temperature < 37.8;

  const noLabAlerts = computeLabAlerts(input.labValues).length === 0;

  const evolution24h = evolutionDelayHours < 24;

  const criteria: DischargeCriterion[] = [
    {
      id: "vitals_normal",
      label: "Sinais vitais no último registro dentro da faixa",
      met: vitalsNormal,
      detail: vitalsNormal
        ? "Último registro sem alertas de faixa ou criticidade."
        : "Registre vitais ou corrija alterações no último registro.",
    },
    {
      id: "afebril",
      label: "Afebril (Tax < 37,8 °C)",
      met: afebril,
      detail: afebril
        ? `Tax ${ultimoVital?.temperature} °C no último registro.`
        : "Informe temperatura no último registro de sinais vitais.",
    },
    {
      id: "no_lab_alerts",
      label: "Nenhum alerta de exame ativo",
      met: noLabAlerts,
      detail: noLabAlerts
        ? "Sem alertas de faixa ou tendência nos exames."
        : "Reavalie exames com alerta ativo.",
    },
    {
      id: "evolution_24h",
      label: "Evolução nas últimas 24h",
      met: evolution24h,
      detail: evolution24h
        ? `Última evolução há ${Math.floor(evolutionDelayHours)}h.`
        : "Registre evolução médica.",
    },
  ];

  const met = criteria.filter((c) => c.met).length;

  return {
    risk,
    riskReasons,
    evolutionDelayHours,
    evolutionDelayAlert,
    discharge: {
      met,
      total: 4,
      criteria,
      disclaimer: DISCHARGE_DISCLAIMER,
    },
  };
}
