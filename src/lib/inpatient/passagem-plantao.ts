import { computeStatusForEpisode } from "@/lib/inpatient/clinical-status-batch";
import type { EpisodeClinicalBundle } from "@/lib/inpatient/clinical-status-batch";
import type { CodeStatus } from "@/lib/inpatient/code-status";
import {
  buildPatientHandoffBlock,
  buildUnitHandoffDocument,
  stripHtmlToPlain,
} from "@/lib/inpatient/handoff-text";
import type { EpisodeHandoffTask } from "@/lib/types/inpatient-chart";

export type PassagemEpisodeRow = {
  id: string;
  bed: string | null;
  diagnosis: string | null;
  created_at: string;
  patient_name: string;
  unit: string;
  code_status: CodeStatus;
  contingency_plan: string;
  tasks: EpisodeHandoffTask[];
  last_evolution_html: string | null;
  birth_date: string | null;
};

export function buildFullHandoffText(episodes: PassagemEpisodeRow[], bundles: Map<string, EpisodeClinicalBundle>): string {
  const byUnit = new Map<string, PassagemEpisodeRow[]>();
  for (const ep of episodes) {
    const unit = ep.unit?.trim() || "Sem setor";
    const list = byUnit.get(unit) ?? [];
    list.push(ep);
    byUnit.set(unit, list);
  }

  const sections: string[] = [];
  const sortedUnits = [...byUnit.keys()].sort((a, b) => a.localeCompare(b));

  let total = 0;
  for (const unit of sortedUnits) {
    const list = byUnit.get(unit) ?? [];
    total += list.length;
    const blocks = list.map((ep) => {
      const status = computeStatusForEpisode(
        ep.id,
        ep.created_at,
        ep.birth_date,
        bundles,
      );
      return buildPatientHandoffBlock({
        patientName: ep.patient_name,
        bed: ep.bed,
        codeStatus: ep.code_status,
        clinicalStatus: status,
        diagnosis: ep.diagnosis,
        admissionAt: ep.created_at,
        lastEvolutionPlain: ep.last_evolution_html
          ? stripHtmlToPlain(ep.last_evolution_html)
          : null,
        tasks: ep.tasks,
        contingencyPlan: ep.contingency_plan,
      });
    });
    sections.push(buildUnitHandoffDocument(`INTERNADOS — ${unit}`, blocks));
  }

  const intro = `PASSAGEM DE PLANTÃO — ${new Date().toLocaleString("pt-BR")}\nTotal: ${total} paciente(s) internado(s)\n`;
  return `${intro}\n${sections.join("\n\n")}`;
}
