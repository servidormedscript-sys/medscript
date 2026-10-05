import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStatusForEpisode } from "@/lib/inpatient/clinical-status-batch";
import { loadClinicalBundles } from "@/lib/inpatient/load-clinical-bundles";
import { buildSpecialtyChart } from "@/lib/inpatient/specialty-aggregation";
import type { OrganizationBedStatus } from "@/lib/types/organization-bed";
import type { RiskLevel } from "@/lib/types/patient";

export type BedMapPayload = {
  beds: Array<{
    id: string;
    code: string;
    unit: string;
    status: OrganizationBedStatus;
    episode_id: string | null;
    episode: {
      id: string;
      patient_name: string;
      diagnosis: string | null;
      care_specialty: string | null;
      risk: RiskLevel;
    } | null;
  }>;
  summary: {
    total: number;
    livre: number;
    ocupado: number;
    higienizacao: number;
    bloqueado: number;
  };
  specialty_chart: ReturnType<typeof buildSpecialtyChart>;
};

export async function buildBedMapPayload(
  supabase: SupabaseClient,
  adminId: string,
): Promise<BedMapPayload> {
  const [{ data: beds }, { data: episodes }] = await Promise.all([
    supabase
      .from("organization_beds")
      .select("id, code, unit, status, episode_id")
      .eq("admin_id", adminId)
      .order("unit")
      .order("code"),
    supabase
      .from("patient_episodes")
      .select(
        `
        id,
        status,
        diagnosis,
        care_specialty,
        created_at,
        patient:patients (full_name, birth_date, admin_id)
      `,
      )
      .eq("status", "internado")
      .is("archived_at", null),
  ]);

  const internados = (episodes ?? []).filter((e) => {
    const p = e.patient as { admin_id?: string; birth_date?: string | null; full_name?: string } | null;
    return p?.admin_id === adminId;
  });

  const bundles = await loadClinicalBundles(
    supabase,
    internados.map((e) => e.id),
  );

  const episodeMeta = new Map<
    string,
    {
      patient_name: string;
      diagnosis: string | null;
      care_specialty: string | null;
      risk: RiskLevel;
    }
  >();

  const internadosForChart = internados.map((ep) => {
    const p = ep.patient as { birth_date?: string | null; full_name?: string };
    const status = computeStatusForEpisode(
      ep.id,
      ep.created_at,
      p?.birth_date ?? null,
      bundles,
    );
    episodeMeta.set(ep.id, {
      patient_name: p?.full_name ?? "—",
      diagnosis: ep.diagnosis,
      care_specialty: ep.care_specialty,
      risk: status.risk,
    });
    return {
      status: ep.status,
      care_specialty: ep.care_specialty,
      diagnosis: ep.diagnosis,
      clinical_risk: status.risk,
    };
  });

  const specialty_chart = buildSpecialtyChart(internadosForChart);

  const summary = {
    total: beds?.length ?? 0,
    livre: 0,
    ocupado: 0,
    higienizacao: 0,
    bloqueado: 0,
  };

  const bedRows = (beds ?? []).map((bed) => {
    summary[bed.status as OrganizationBedStatus] += 1;
    const meta = bed.episode_id ? episodeMeta.get(bed.episode_id) : undefined;
    return {
      id: bed.id,
      code: bed.code,
      unit: bed.unit,
      status: bed.status as OrganizationBedStatus,
      episode_id: bed.episode_id,
      episode:
        bed.episode_id && meta
          ? {
              id: bed.episode_id,
              patient_name: meta.patient_name,
              diagnosis: meta.diagnosis,
              care_specialty: meta.care_specialty,
              risk: meta.risk,
            }
          : null,
    };
  });

  return { beds: bedRows, summary, specialty_chart };
}
