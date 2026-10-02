import type { SupabaseClient } from "@supabase/supabase-js";

export async function appendTimelineEvent(
  supabase: SupabaseClient,
  input: {
    episode_id: string;
    event_type: string;
    summary_text: string;
    occurred_at?: string;
    source_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("episode_timeline_events").insert({
    episode_id: input.episode_id,
    event_type: input.event_type,
    summary_text: input.summary_text,
    occurred_at: input.occurred_at ?? new Date().toISOString(),
    source_id: input.source_id ?? null,
  });
  if (error) {
    console.error("timeline insert failed", error.message);
  }
}
