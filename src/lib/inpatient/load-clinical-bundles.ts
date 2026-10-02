import type { SupabaseClient } from "@supabase/supabase-js";
import type { EpisodeClinicalBundle } from "@/lib/inpatient/clinical-status-batch";
import type { EpisodeLabValue, EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

function mapVital(row: Record<string, unknown>): EpisodeVitalRecord {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    recorded_at: String(row.recorded_at),
    pas: row.pas != null ? Number(row.pas) : null,
    pad: row.pad != null ? Number(row.pad) : null,
    fc: row.fc != null ? Number(row.fc) : null,
    fr: row.fr != null ? Number(row.fr) : null,
    spo2: row.spo2 != null ? Number(row.spo2) : null,
    temperature: row.temperature != null ? Number(row.temperature) : null,
    glasgow: row.glasgow != null ? Number(row.glasgow) : null,
    diurese_ml: row.diurese_ml != null ? Number(row.diurese_ml) : null,
    observation: row.observation != null ? String(row.observation) : null,
    o2_type: row.o2_type as EpisodeVitalRecord["o2_type"],
    o2_flow_lmin:
      row.o2_flow_lmin != null ? Number(row.o2_flow_lmin) : null,
    central_venous_access: Boolean(row.central_venous_access),
    iot: Boolean(row.iot),
    monitoring: Boolean(row.monitoring),
    care_location: row.care_location as EpisodeVitalRecord["care_location"],
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

function mapLab(row: Record<string, unknown>): EpisodeLabValue {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    analyte_key: String(row.analyte_key),
    value: Number(row.value),
    collected_at: String(row.collected_at),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function loadClinicalBundles(
  supabase: SupabaseClient,
  episodeIds: string[],
): Promise<Map<string, EpisodeClinicalBundle>> {
  const map = new Map<string, EpisodeClinicalBundle>();
  if (episodeIds.length === 0) return map;

  for (const id of episodeIds) {
    map.set(id, { vitals: [], labs: [], evolutionAt: [] });
  }

  const [vRes, lRes, eRes] = await Promise.all([
    supabase
      .from("episode_vital_records")
      .select("*")
      .in("episode_id", episodeIds),
    supabase
      .from("episode_lab_values")
      .select("*")
      .in("episode_id", episodeIds),
    supabase
      .from("episode_evolutions")
      .select("episode_id, created_at")
      .in("episode_id", episodeIds),
  ]);

  if (vRes.data) {
    for (const row of vRes.data) {
      const id = String(row.episode_id);
      const bundle = map.get(id)!;
      bundle.vitals.push(mapVital(row as Record<string, unknown>));
    }
  }
  if (lRes.data) {
    for (const row of lRes.data) {
      const id = String(row.episode_id);
      const bundle = map.get(id)!;
      bundle.labs.push(mapLab(row as Record<string, unknown>));
    }
  }
  if (eRes.data) {
    for (const row of eRes.data) {
      const id = String(row.episode_id);
      const bundle = map.get(id)!;
      bundle.evolutionAt.push(String(row.created_at));
    }
  }

  return map;
}
