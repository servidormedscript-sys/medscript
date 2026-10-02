import { ageInMonths } from "@/lib/utils/age";
import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

export type VitalAlert = {
  field: string;
  message: string;
};

type Range = { min: number; max: number };

const ADULT_RANGES: Record<string, Range> = {
  pas: { min: 90, max: 140 },
  pad: { min: 60, max: 90 },
  fc: { min: 60, max: 100 },
  fr: { min: 12, max: 20 },
  spo2: { min: 94, max: 100 },
  temperature: { min: 36, max: 37.5 },
};

type PediatricBand = {
  maxMonths: number;
  label: string;
  fr: Range;
  fcAwake: Range;
};

const PEDIATRIC_BANDS: PediatricBand[] = [
  {
    maxMonths: 2,
    label: "Neonato",
    fr: { min: 30, max: 60 },
    fcAwake: { min: 100, max: 205 },
  },
  {
    maxMonths: 12,
    label: "2 meses a 1 ano",
    fr: { min: 30, max: 53 },
    fcAwake: { min: 100, max: 180 },
  },
  {
    maxMonths: 24,
    label: "1 a 2 anos",
    fr: { min: 22, max: 37 },
    fcAwake: { min: 98, max: 140 },
  },
  {
    maxMonths: 72,
    label: "3 a 6 anos",
    fr: { min: 20, max: 28 },
    fcAwake: { min: 80, max: 120 },
  },
  {
    maxMonths: 120,
    label: "6 a 10 anos",
    fr: { min: 18, max: 25 },
    fcAwake: { min: 75, max: 118 },
  },
  {
    maxMonths: Infinity,
    label: "Acima de 10 anos",
    fr: { min: 12, max: 20 },
    fcAwake: { min: 60, max: 100 },
  },
];

function pediatricBand(months: number): PediatricBand {
  for (const band of PEDIATRIC_BANDS) {
    if (months <= band.maxMonths) return band;
  }
  return PEDIATRIC_BANDS[PEDIATRIC_BANDS.length - 1]!;
}

function outOfRange(value: number, range: Range): "low" | "high" | null {
  if (value < range.min) return "low";
  if (value > range.max) return "high";
  return null;
}

function alertMessage(
  label: string,
  value: number,
  unit: string,
  direction: "low" | "high",
): string {
  const adj = direction === "low" ? "baixo" : "alto";
  return `${label} ${adj} (${value} ${unit})`;
}

function checkNumericField(
  alerts: VitalAlert[],
  field: string,
  label: string,
  value: number | null | undefined,
  range: Range,
  unit: string,
) {
  if (value == null) return;
  const dir = outOfRange(value, range);
  if (dir) {
    alerts.push({
      field,
      message: alertMessage(label, value, unit, dir),
    });
  }
}

export function getVitalAlertsForRecord(
  record: EpisodeVitalRecord,
  birthDate: string | null | undefined,
): VitalAlert[] {
  const alerts: VitalAlert[] = [];
  const months = birthDate ? ageInMonths(birthDate) : null;
  const pediatric = months != null && months < 216;

  if (pediatric && months != null) {
    const band = pediatricBand(months);
    checkNumericField(alerts, "fr", "FR", record.fr, band.fr, "irpm");
    checkNumericField(alerts, "fc", "FC", record.fc, band.fcAwake, "bpm");
    checkNumericField(
      alerts,
      "spo2",
      "SpO₂",
      record.spo2,
      ADULT_RANGES.spo2,
      "%",
    );
    checkNumericField(
      alerts,
      "temperature",
      "Tax",
      record.temperature,
      ADULT_RANGES.temperature,
      "°C",
    );
    if (record.pas != null) {
      checkNumericField(
        alerts,
        "pas",
        "PAS",
        record.pas,
        ADULT_RANGES.pas,
        "mmHg",
      );
    }
    if (record.pad != null) {
      checkNumericField(
        alerts,
        "pad",
        "PAD",
        record.pad,
        ADULT_RANGES.pad,
        "mmHg",
      );
    }
    return alerts;
  }

  checkNumericField(
    alerts,
    "pas",
    "PAS",
    record.pas,
    ADULT_RANGES.pas,
    "mmHg",
  );
  checkNumericField(
    alerts,
    "pad",
    "PAD",
    record.pad,
    ADULT_RANGES.pad,
    "mmHg",
  );
  checkNumericField(alerts, "fc", "FC", record.fc, ADULT_RANGES.fc, "bpm");
  checkNumericField(alerts, "fr", "FR", record.fr, ADULT_RANGES.fr, "irpm");
  checkNumericField(
    alerts,
    "spo2",
    "SpO₂",
    record.spo2,
    ADULT_RANGES.spo2,
    "%",
  );
  checkNumericField(
    alerts,
    "temperature",
    "Tax",
    record.temperature,
    ADULT_RANGES.temperature,
    "°C",
  );

  return alerts;
}

export function getReferenceRange(
  field: "pas" | "pad" | "fc" | "fr" | "spo2" | "temperature",
  birthDate: string | null | undefined,
): Range | null {
  const months = birthDate ? ageInMonths(birthDate) : null;
  const pediatric = months != null && months < 216;

  if (field === "spo2" || field === "temperature") {
    return ADULT_RANGES[field];
  }

  if (pediatric && months != null) {
    const band = pediatricBand(months);
    if (field === "fr") return band.fr;
    if (field === "fc") return band.fcAwake;
    if (field === "pas") return ADULT_RANGES.pas;
    if (field === "pad") return ADULT_RANGES.pad;
  }

  if (field in ADULT_RANGES) {
    return ADULT_RANGES[field];
  }
  return null;
}

/** Vitais críticos usados depois na classificação de risco (2.10). */
export function getCriticalVitalAlerts(
  record: EpisodeVitalRecord | null,
): VitalAlert[] {
  if (!record) return [];
  const alerts: VitalAlert[] = [];
  if (record.spo2 != null && record.spo2 < 90) {
    alerts.push({
      field: "spo2",
      message: `SpO₂ crítica (${record.spo2}%)`,
    });
  }
  if (record.pas != null && record.pas < 90) {
    alerts.push({
      field: "pas",
      message: `PAS crítica (${record.pas} mmHg)`,
    });
  }
  if (record.pas != null && record.pas > 220) {
    alerts.push({
      field: "pas",
      message: `PAS muito elevada (${record.pas} mmHg)`,
    });
  }
  if (record.fc != null && (record.fc < 40 || record.fc > 150)) {
    alerts.push({
      field: "fc",
      message: `FC crítica (${record.fc} bpm)`,
    });
  }
  if (record.glasgow != null && record.glasgow <= 8) {
    alerts.push({
      field: "glasgow",
      message: `Glasgow crítico (${record.glasgow})`,
    });
  }
  if (record.temperature != null) {
    if (record.temperature >= 39.5) {
      alerts.push({
        field: "temperature",
        message: `Tax crítica (${record.temperature} °C)`,
      });
    } else if (record.temperature <= 35) {
      alerts.push({
        field: "temperature",
        message: `Tax crítica (${record.temperature} °C)`,
      });
    }
  }
  return alerts;
}
