import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCoreClinicalSnapshot } from "@/lib/inpatient/core-clinical-snapshot";
import { loadClinicalBundles } from "@/lib/inpatient/load-clinical-bundles";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type { EvolutionDraftMode } from "@/lib/inpatient/evolution-context";
import { coreGenerationKindForMode } from "@/lib/inpatient/evolution-core-draft";

export async function recordSignedEvolutionSideEffects(
  supabase: SupabaseClient,
  input: {
    episode_id: string;
    evolution_id: string;
    content_html: string;
    user_id: string;
    draft_mode?: EvolutionDraftMode | null;
  },
): Promise<void> {
  await appendTimelineEvent(supabase, {
    episode_id: input.episode_id,
    event_type: "evolucao",
    summary_text: "Evolução médica assinada",
    source_id: input.evolution_id,
  });

  const kind = input.draft_mode
    ? coreGenerationKindForMode(input.draft_mode)
    : null;
  if (kind) {
    const bundles = await loadClinicalBundles(supabase, [input.episode_id]);
    const bundle = bundles.get(input.episode_id) ?? {
      vitals: [],
      labs: [],
      evolutionAt: [],
    };
    const clinical_snapshot = buildCoreClinicalSnapshot({
      vitalRecords: bundle.vitals,
      labValues: bundle.labs,
    });

    await supabase.from("episode_core_generations").insert({
      episode_id: input.episode_id,
      generation_kind: kind,
      content_html: input.content_html,
      created_by: input.user_id,
      clinical_snapshot,
    });
    await appendTimelineEvent(supabase, {
      episode_id: input.episode_id,
      event_type: "core_geracao",
      summary_text: `Documento CORE (${kind}) gerado na evolução`,
      source_id: input.evolution_id,
    });

    if (kind === "core_inicial") {
      await supabase
        .from("episode_conduct")
        .update({ core_status: "aguardando", updated_at: new Date().toISOString() })
        .eq("episode_id", input.episode_id);
    }
  }
}
