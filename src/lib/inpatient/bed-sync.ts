import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationBedStatus } from "@/lib/types/organization-bed";

export async function occupyOrganizationBed(
  supabase: SupabaseClient,
  adminId: string,
  bedId: string,
  episodeId: string,
): Promise<string | null> {
  const { data: bed, error: bedError } = await supabase
    .from("organization_beds")
    .select("id, status, code, admin_id")
    .eq("id", bedId)
    .single();

  if (bedError || !bed || bed.admin_id !== adminId) {
    return "Leito não encontrado.";
  }

  if (bed.status !== "livre") {
    return "Este leito não está disponível para internação.";
  }

  const now = new Date().toISOString();

  const { error: bedUpdateError } = await supabase
    .from("organization_beds")
    .update({
      status: "ocupado",
      episode_id: episodeId,
      updated_at: now,
    })
    .eq("id", bedId);

  if (bedUpdateError) return bedUpdateError.message;

  const { error: epError } = await supabase
    .from("patient_episodes")
    .update({
      organization_bed_id: bedId,
      bed: bed.code,
      updated_at: now,
    })
    .eq("id", episodeId);

  if (epError) return epError.message;

  return null;
}

export async function releaseOrganizationBedForEpisode(
  supabase: SupabaseClient,
  adminId: string,
  episodeId: string,
): Promise<void> {
  const { data: beds } = await supabase
    .from("organization_beds")
    .select("id")
    .eq("admin_id", adminId)
    .eq("episode_id", episodeId);

  if (!beds?.length) return;

  const now = new Date().toISOString();

  await supabase
    .from("organization_beds")
    .update({
      status: "higienizacao",
      episode_id: null,
      updated_at: now,
    })
    .in("id", beds.map((b) => b.id));

  await supabase
    .from("patient_episodes")
    .update({ organization_bed_id: null, updated_at: now })
    .eq("id", episodeId);
}

export async function setOrganizationBedStatus(
  supabase: SupabaseClient,
  adminId: string,
  bedId: string,
  status: OrganizationBedStatus,
): Promise<string | null> {
  const { data: bed } = await supabase
    .from("organization_beds")
    .select("id, admin_id, status, episode_id")
    .eq("id", bedId)
    .single();

  if (!bed || bed.admin_id !== adminId) {
    return "Leito não encontrado.";
  }

  if (status === "livre" && bed.status === "ocupado" && bed.episode_id) {
    return "Não é possível liberar um leito ocupado — dê alta ao paciente primeiro.";
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "livre" || status === "higienizacao" || status === "bloqueado") {
    patch.episode_id = null;
  }

  const { error } = await supabase
    .from("organization_beds")
    .update(patch)
    .eq("id", bedId);

  return error?.message ?? null;
}
