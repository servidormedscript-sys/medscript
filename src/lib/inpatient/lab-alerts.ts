import { getAnalyte, type LabAnalyteDef } from "@/lib/inpatient/lab-analytes";
import type { EpisodeLabValue } from "@/lib/types/inpatient-chart";

export type LabAlert = {
  analyteKey: string;
  kind: "range" | "trend";
  message: string;
};

type TrendRule = {
  rising?: string;
  falling?: string;
};

const TREND_RULES: Record<string, TrendRule> = {
  creatinina: {
    rising:
      "Creatinina em elevação — reavaliar função renal e drogas nefrotóxicas.",
  },
  potassio: {
    rising: "Potássio em elevação — reavaliar risco de hipercalemia.",
    falling:
      "Potássio em queda — reavaliar risco de hipocalemia (sobretudo se em diurético).",
  },
  sodio: {
    rising: "Sódio em elevação — reavaliar hidratação/aporte de sódio.",
    falling: "Sódio em queda — investigar causas de hiponatremia.",
  },
  hemoglobina: {
    falling:
      "Hemoglobina em queda — investigar sangramento oculto/ativo.",
  },
  pcr: {
    rising:
      "PCR em elevação — reavaliar foco infeccioso e resposta ao tratamento.",
  },
  lactato: {
    rising:
      "Lactato em elevação — reavaliar perfusão/adequação da reanimação volêmica.",
  },
  leucocitos: {
    rising: "Leucócitos em elevação — reavaliar foco infeccioso.",
  },
  plaquetas: {
    falling:
      "Plaquetas em queda — investigar causa (sepse, medicamentos, CIVD).",
  },
};

function rangeAlert(def: LabAnalyteDef, value: number): string | null {
  if (value < def.min) {
    return `${def.label} abaixo da faixa (${value} ${def.unit})`;
  }
  if (value > def.max) {
    return `${def.label} acima da faixa (${value} ${def.unit})`;
  }
  return null;
}

function latestTwoByAnalyte(
  values: EpisodeLabValue[],
  key: string,
): [EpisodeLabValue | null, EpisodeLabValue | null] {
  const sorted = values
    .filter((v) => v.analyte_key === key)
    .sort(
      (a, b) =>
        new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
    );
  return [sorted[0] ?? null, sorted[1] ?? null];
}

export function computeLabAlerts(values: EpisodeLabValue[]): LabAlert[] {
  const alerts: LabAlert[] = [];
  const keys = new Set(values.map((v) => v.analyte_key));

  for (const key of keys) {
    const def = getAnalyte(key);
    if (!def) continue;
    const [latest] = latestTwoByAnalyte(values, key);
    if (latest) {
      const msg = rangeAlert(def, latest.value);
      if (msg) {
        alerts.push({ analyteKey: key, kind: "range", message: msg });
      }
    }

    const [last, prev] = latestTwoByAnalyte(values, key);
    const trend = TREND_RULES[key];
    if (last && prev && trend) {
      if (trend.rising && last.value > prev.value) {
        alerts.push({
          analyteKey: key,
          kind: "trend",
          message: trend.rising,
        });
      }
      if (trend.falling && last.value < prev.value) {
        alerts.push({
          analyteKey: key,
          kind: "trend",
          message: trend.falling,
        });
      }
    }
  }

  return alerts;
}

export function hasActiveLabAlert(values: EpisodeLabValue[]): boolean {
  return computeLabAlerts(values).length > 0;
}
