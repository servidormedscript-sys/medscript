import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

export async function GET(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const archivedOnly = searchParams.get("archived") === "true";
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase
    .from("patients")
    .select(
      `
      *,
      patient_episodes (
        id,
        episode_number,
        status,
        weight,
        bed,
        allergies,
        medications,
        risk_level,
        archived_at,
        created_at,
        patient_movements (
          id,
          from_status,
          to_status,
          report_text,
          risk_level,
          alta_days,
          created_at
        )
      )
    `
    )
    .eq("admin_id", adminId)
    .order("updated_at", { ascending: false });

  if (archivedOnly) {
    query = query.eq("is_archived", true);
  } else if (activeOnly) {
    query = query.eq("is_archived", false);
  }

  if (q) {
    const cpfDigits = q.replace(/\D/g, "");
    if (cpfDigits.length >= 3) {
      query = query.or(`full_name.ilike.%${q}%,cpf.ilike.%${cpfDigits}%`);
    } else {
      query = query.ilike("full_name", `%${q}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ patients: data ?? [] });
}
