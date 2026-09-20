import { EMERGENCY_SCHOOL_PHASES } from "./catalog";
import type {
  ModuleWithState,
  PhaseWithState,
  SchoolModuleStatus,
  SchoolProgressRecord,
} from "./types";

function sortPhases() {
  return [...EMERGENCY_SCHOOL_PHASES].sort((a, b) => a.order - b.order);
}

export function buildTrackWithProgress(
  progress: SchoolProgressRecord[]
): PhaseWithState[] {
  const progressMap = new Map(
    progress.map((item) => [item.module_id, item] as const)
  );

  const phases = sortPhases();
  const result: PhaseWithState[] = [];

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex += 1) {
    const phase = phases[phaseIndex];
    const previousPhase = phaseIndex > 0 ? result[phaseIndex - 1] : null;
    const previousPhaseComplete =
      !previousPhase ||
      previousPhase.completedCount === previousPhase.totalCount;

    const modules: ModuleWithState[] = phase.modules.map((module, moduleIndex) => {
      const record = progressMap.get(module.id);
      let status: SchoolModuleStatus = "locked";

      if (record?.status === "completed") {
        status = "completed";
      } else if (record?.status === "in_progress") {
        status = "in_progress";
      } else if (previousPhaseComplete) {
        if (moduleIndex === 0) {
          status = "available";
        } else {
          const previousModule = phase.modules[moduleIndex - 1];
          const previousRecord = progressMap.get(previousModule.id);
          status =
            previousRecord?.status === "completed" ? "available" : "locked";
        }
      }

      return {
        ...module,
        status,
        completedAt: record?.completed_at ?? null,
      };
    });

    const completedCount = modules.filter((m) => m.status === "completed").length;

    result.push({
      id: phase.id,
      order: phase.order,
      title: phase.title,
      subtitle: phase.subtitle,
      accentClass: phase.accentClass,
      modules,
      completedCount,
      totalCount: modules.length,
    });
  }

  return result;
}

export function getTrackSummary(phases: PhaseWithState[]) {
  const totalModules = phases.reduce((sum, phase) => sum + phase.totalCount, 0);
  const completedModules = phases.reduce(
    (sum, phase) => sum + phase.completedCount,
    0
  );
  const percent =
    totalModules === 0
      ? 0
      : Math.round((completedModules / totalModules) * 100);

  return { totalModules, completedModules, percent };
}
