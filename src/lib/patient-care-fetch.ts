import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEpisodeCareSummary, groupCareItemsByEpisode } from "@/lib/patient-care-summary";
import type { PatientCareItem } from "@/lib/types/patient-care";
import { todayDateString } from "@/lib/types/patient-care";

export async function fetchCareItemsByEpisode(
  supabase: SupabaseClient,
  episodeIds: string[],
  today = todayDateString()
) {
  if (episodeIds.length === 0) {
    return {
      itemsByEpisode: {} as Record<string, PatientCareItem[]>,
      summariesByEpisode: {} as Record<
        string,
        ReturnType<typeof buildEpisodeCareSummary>
      >,
      today,
    };
  }

  const { data, error } = await supabase
    .from("patient_care_items")
    .select(
      `
      *,
      medication_doses:patient_medication_doses (*)
    `
    )
    .in("episode_id", episodeIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const enriched = (data ?? []).map((item) => ({
    ...item,
    medication_doses: (item.medication_doses ?? []).filter(
      (dose: { dose_date: string }) => dose.dose_date === today
    ),
  })) as (PatientCareItem & { episode_id: string })[];

  const itemsByEpisode = groupCareItemsByEpisode(enriched);
  const summariesByEpisode = Object.fromEntries(
    Object.entries(itemsByEpisode).map(([episodeId, items]) => [
      episodeId,
      buildEpisodeCareSummary(items, today),
    ])
  );

  return { itemsByEpisode, summariesByEpisode, today };
}
