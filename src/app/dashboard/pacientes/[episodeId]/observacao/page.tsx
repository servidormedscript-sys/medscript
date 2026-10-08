import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ObservationLightApp from "@/components/dashboard/pacientes/ObservationLightApp";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import { requireSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import type { Patient, PatientEpisode } from "@/lib/types/patient";

type PageProps = {
  params: Promise<{ episodeId: string }>;
};

export default async function ObservationEpisodePage({ params }: PageProps) {
  const { profile } = await requireSessionProfile();
  if (!profile) redirect("/login");

  const adminId = getOrganizationAdminId(profile);
  const { episodeId } = await params;

  const supabase = await createClient();
  const { data: episode, error } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (error || !episode) notFound();

  const patient = episode.patient as Patient | undefined;
  if (!patient || patient.admin_id !== adminId) notFound();

  if (episode.archived_at) {
    return (
      <div className="p-8">
        <p className="text-sm text-navy-800/70">Ficha arquivada.</p>
        <Link href="/dashboard/relatorio-pacientes" className="mt-2 text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50/30 px-4 py-8 sm:px-6 lg:px-8">
      <ObservationLightApp
        episode={episode as PatientEpisode}
        patient={patient}
      />
    </div>
  );
}
