import type { EpisodeConduct } from "@/lib/types/inpatient-chart";
import type { PatientStatus } from "@/lib/types/patient";

export type EvolutionDraftMode =
  | "diaria"
  | "alta"
  | "core_inicial"
  | "core_atualizacao"
  | "judicializada";

export const EVOLUTION_MODE_LABELS: Record<EvolutionDraftMode, string> = {
  diaria: "Evolução diária",
  alta: "Preparar alta",
  core_inicial: "CORE — solicitação inicial",
  core_atualizacao: "Atualização CORE",
  judicializada: "Vaga judicializada",
};

export function resolveEvolutionDraftMode(input: {
  episodeStatus: PatientStatus;
  conduct: EpisodeConduct | null;
  coreGenerationsCount: number;
  dischargeConfirmed: boolean;
  manualMode?: EvolutionDraftMode | null;
}): EvolutionDraftMode {
  if (input.manualMode) return input.manualMode;

  if (
    input.episodeStatus === "alta_recente" ||
    input.dischargeConfirmed
  ) {
    return "alta";
  }

  const conduct = input.conduct;
  if (!conduct) return "diaria";

  if (conduct.vaga_judicializada) return "judicializada";

  const hasCore = conduct.core_status !== "nenhum";
  if (hasCore && input.coreGenerationsCount > 0) {
    return "core_atualizacao";
  }
  if (hasCore) return "core_inicial";

  return "diaria";
}

export function modeUsesRegulationCheck(mode: EvolutionDraftMode): boolean {
  return (
    mode === "core_inicial" ||
    mode === "core_atualizacao" ||
    mode === "judicializada"
  );
}
