import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";
import type { CoreStatus, CodeStatus, TransferClass } from "@/lib/types/inpatient-chart";

export function summarizeVitalTimeline(
  record: Pick<
    EpisodeVitalRecord,
    "pas" | "pad" | "fc" | "fr" | "spo2" | "glasgow" | "o2_type" | "o2_flow_lmin"
  >,
): string {
  const bits: string[] = [];
  if (record.pas != null) bits.push(`PAS ${record.pas}`);
  if (record.pad != null) bits.push(`PAD ${record.pad}`);
  if (record.fc != null) bits.push(`FC ${record.fc}`);
  if (record.fr != null) bits.push(`FR ${record.fr}`);
  if (record.spo2 != null) bits.push(`SpO₂ ${record.spo2}%`);
  if (record.glasgow != null) bits.push(`Glasgow ${record.glasgow}`);
  if (record.o2_type && record.o2_type !== "ar_ambiente") {
    bits.push(
      `O₂ ${record.o2_type}${record.o2_flow_lmin ? ` ${record.o2_flow_lmin} L/min` : ""}`,
    );
  }
  return bits.length > 0 ? bits.join(", ") : "Registro de sinais vitais";
}

const CODE_LABELS: Record<CodeStatus, string> = {
  reanimacao_plena: "Reanimação plena",
  onr: "ONR",
  conforto: "Conforto",
};

const CORE_LABELS: Record<CoreStatus, string> = {
  nenhum: "Nenhum",
  aguardando: "Aguardando",
  autorizado: "Autorizado",
  negado: "Negado",
};

const TRANSFER_LABELS: Record<TransferClass, string> = {
  sem: "Sem classificação adicional",
  prioritaria: "Prioritária",
  urgente: "Urgente",
  emergencial: "Emergencial",
};

export function summarizeConductTimelineChange(
  before: {
    code_status?: CodeStatus;
    core_status?: CoreStatus;
    vaga_judicializada?: boolean;
    transfer_class?: TransferClass;
    transfer_class_confirmed?: boolean;
  },
  after: {
    code_status: CodeStatus;
    core_status: CoreStatus;
    vaga_judicializada: boolean;
    transfer_class: TransferClass;
    transfer_class_confirmed: boolean;
  },
): string[] {
  const lines: string[] = [];
  if (before.code_status !== undefined && before.code_status !== after.code_status) {
    lines.push(`Status de código: ${CODE_LABELS[after.code_status]}`);
  }
  if (before.core_status !== undefined && before.core_status !== after.core_status) {
    lines.push(`Status CORE: ${CORE_LABELS[after.core_status]}`);
  }
  if (
    before.vaga_judicializada !== undefined &&
    !before.vaga_judicializada &&
    after.vaga_judicializada
  ) {
    lines.push("Vaga judicializada marcada na conduta");
  }
  if (
    before.transfer_class !== undefined &&
    before.transfer_class !== after.transfer_class
  ) {
    lines.push(
      `Classificação de transferência: ${TRANSFER_LABELS[after.transfer_class]}`,
    );
  }
  if (
    before.transfer_class_confirmed !== undefined &&
    !before.transfer_class_confirmed &&
    after.transfer_class_confirmed
  ) {
    lines.push("Classificação de transferência confirmada");
  }
  return lines;
}
