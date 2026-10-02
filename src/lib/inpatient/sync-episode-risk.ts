import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeStatusForEpisode,
  type EpisodeClinicalBundle,
} from "@/lib/inpatient/clinical-status-batch";
import { loadClinicalBundles } from "@/lib/inpatient/load-clinical-bundles";
import type { RiskLevel } from "@/lib/types/patient";

export async function refreshEpisodeRiskLevel(
  supabase: SupabaseClient,
  episodeId: string,
  input: { admissionAt: string; birthDate: string | null },
): Promise<RiskLevel | null> {
  let bundles: Map<string, EpisodeClinicalBundle>;
  try {
    bundles = await loadClinicalBundles(supabase, [episodeId]);
  } catch {
    return null;
  }

  const status = computeStatusForEpisode(
    episodeId,
    input.admissionAt,
    input.birthDate,
    bundles,
  );

  await supabase
    .from("patient_episodes")
    .update({
      risk_level: status.risk,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);

  return status.risk;
}
