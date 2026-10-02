import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import type { CriticalLabConduct } from "@/lib/inpatient/lab-critical-conduct";
import type { LabAlert } from "@/lib/inpatient/lab-alerts";
import { getCriticalVitalAlerts } from "@/lib/inpatient/vital-alerts";
import { pickUltimoVital } from "@/lib/inpatient/vital-devices";
import type { CodeStatus } from "@/lib/types/inpatient-chart";
import type { EpisodeLabPending, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";
import type { InpatientChartTabId } from "@/lib/inpatient/chart-tabs";

export type NextStepPriority = "urgent" | "attention" | "positive";

export type PatientNextStep = {
  id: string;
  priority: NextStepPriority;
  text: string;
  tab: InpatientChartTabId;
};

const HOURS_URGENT_PENDING = 4;
const HOURS_ROUTINE_PENDING = 24;

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function buildPatientNextSteps(input: {
  clinicalStatus: ClinicalStatusResult;
  vitalRecords: EpisodeVitalRecord[];
  labAlerts: LabAlert[];
  criticalConducts: CriticalLabConduct[];
  pendingReconciliation: number;
  pendingLabs: EpisodeLabPending[];
  codeStatus?: CodeStatus | null;
  internationHours?: number;
  paduaFilled?: boolean;
}): PatientNextStep[] {
  const steps: PatientNextStep[] = [];
  const ultimo = pickUltimoVital(input.vitalRecords);

  for (const c of input.criticalConducts) {
    steps.push({
      id: `critical-${c.id}`,
      priority: "urgent",
      text: c.title,
      tab: "exames",
    });
  }

  if (input.clinicalStatus.risk === "alto") {
    for (const a of getCriticalVitalAlerts(ultimo)) {
      steps.push({
        id: `vital-${a.field}`,
        priority: "urgent",
        text: a.message,
        tab: "vitais",
      });
    }
  }

  if (input.clinicalStatus.evolutionDelayAlert !== "none") {
    steps.push({
      id: "evolution-delay",
      priority:
        input.clinicalStatus.evolutionDelayAlert === "high"
          ? "urgent"
          : "attention",
      text:
        input.clinicalStatus.evolutionDelayAlert === "high"
          ? "Evolução atrasada ≥24h — registrar evolução."
          : "Evolução atrasada ≥12h — considerar registrar evolução.",
      tab: "evolucao",
    });
  }

  for (const p of input.pendingLabs) {
    const h = hoursSince(p.requested_at);
    const limit = p.urgent ? HOURS_URGENT_PENDING : HOURS_ROUTINE_PENDING;
    if (h >= limit) {
      steps.push({
        id: `pending-${p.id}`,
        priority: p.urgent ? "urgent" : "attention",
        text: `Cobrar resultado de ${p.label}, pendente há ${Math.floor(h)}h.`,
        tab: "exames",
      });
    }
  }

  if (input.pendingReconciliation > 0) {
    steps.push({
      id: "recon-pending",
      priority: "attention",
      text: `Reconciliação medicamentosa: ${input.pendingReconciliation} item(ns) de casa sem decisão.`,
      tab: "prescricao",
    });
  }

  const discharge = input.clinicalStatus.discharge;
  if (discharge.met === 3 && discharge.total === 4) {
    const missing = discharge.criteria.find((c) => !c.met);
    steps.push({
      id: "discharge-almost",
      priority: "attention",
      text: missing
        ? `Falta 1 critério de alta: ${missing.label}.`
        : "Falta 1 critério de alta — revisar painel clínico.",
      tab: missing?.id === "evolution_24h" ? "evolucao" : "resumo",
    });
  }

  if (discharge.met === discharge.total) {
    steps.push({
      id: "discharge-ready",
      priority: "positive",
      text: "Todos os critérios de alta atingidos — considerar iniciar processo de alta.",
      tab: "alta",
    });
  }

  if (
    input.codeStatus === "reanimacao_plena" &&
    input.internationHours != null &&
    input.internationHours >= 24 &&
    input.paduaFilled === false
  ) {
    steps.push({
      id: "padua-empty",
      priority: "attention",
      text: "Preencher escore de TEV (Padua ou Caprini) na aba Conduta ou Prescrição.",
      tab: "conduta",
    });
  }

  const order: Record<NextStepPriority, number> = {
    urgent: 0,
    attention: 1,
    positive: 2,
  };
  return steps.sort((a, b) => order[a.priority] - order[b.priority]);
}
