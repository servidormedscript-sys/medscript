import { notFound, redirect } from "next/navigation";
import InpatientChartApp from "@/components/inpatient/InpatientChartApp";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import { requireSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import type { Patient, PatientEpisode } from "@/lib/types/patient";

const CHART_ALLOWED = new Set(["internado", "alta_recente", "em_observacao"]);

type PageProps = {
  params: Promise<{ episodeId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function InpatientChartPage({
  params,
  searchParams,
}: PageProps) {
  const { profile } = await requireSessionProfile();
  if (!profile) {
    redirect("/login");
  }
  const adminId = getOrganizationAdminId(profile);
  const { episodeId } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();
  const { data: episode, error } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (error || !episode) {
    notFound();
  }

  const patient = episode.patient as Patient | undefined;
  if (!patient || patient.admin_id !== adminId) {
    notFound();
  }

  if (episode.archived_at) {
    redirect("/dashboard/relatorio-pacientes");
  }

  if (!CHART_ALLOWED.has(episode.status)) {
    redirect("/dashboard/relatorio-pacientes");
  }

  return (
    <InpatientChartApp
      episode={episode as PatientEpisode}
      patient={patient}
      initialTab={tab}
    />
  );
}
