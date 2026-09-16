import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import type { ActivePatientEpisode } from "@/lib/types/clinical-assessment";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      id,
      episode_number,
      status,
      patient:patients!inner (
        id,
        full_name,
        cpf,
        birth_date,
        sex,
        admin_id
      )
    `
    )
    .eq("patients.admin_id", adminId!)
    .in("status", ["triagem", "em_observacao", "internado", "alta_recente"])
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const patients: ActivePatientEpisode[] = (data ?? []).map((row) => {
    const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
    return {
      id: row.id,
      episode_number: row.episode_number,
      status: row.status,
      patient: {
        id: patient.id,
        full_name: patient.full_name,
        cpf: patient.cpf,
        birth_date: patient.birth_date,
        sex: patient.sex,
      },
    };
  });

  return NextResponse.json({ patients });
}
