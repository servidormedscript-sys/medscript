import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  function episodePatient(
    patient: unknown,
  ): { full_name: string; admin_id?: string } | null {
    if (!patient) return null;
    if (Array.isArray(patient)) {
      return (patient[0] as { full_name: string; admin_id?: string }) ?? null;
    }
    return patient as { full_name: string; admin_id?: string };
  }

  const { data: episodes } = await supabase
    .from("patient_episodes")
    .select("id, bed, patient:patients!inner(full_name, admin_id)")
    .eq("status", "internado")
    .is("archived_at", null);

  const episodeIds =
    episodes
      ?.filter((e) => {
        const p = episodePatient(e.patient);
        return p?.admin_id === adminId;
      })
      .map((e) => e.id) ?? [];

  if (episodeIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const { data: pending, error } = await supabase
    .from("episode_lab_pending")
    .select("*")
    .in("episode_id", episodeIds)
    .is("fulfilled_at", null)
    .order("urgent", { ascending: false })
    .order("requested_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const epMap = new Map(
    (episodes ?? []).map((e) => {
      const p = episodePatient(e.patient);
      return [
        e.id,
        {
          patientName: p?.full_name ?? "—",
          bed: e.bed as string | null,
        },
      ];
    }),
  );

  const items = (pending ?? []).map((row) => {
    const meta = epMap.get(row.episode_id as string);
    const requestedAt = new Date(row.requested_at as string);
    const hours = Math.floor(
      (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60),
    );
    return {
      id: row.id,
      episode_id: row.episode_id,
      label: row.label,
      urgent: row.urgent,
      hours_pending: hours,
      patient_name: meta?.patientName ?? "—",
      bed: meta?.bed,
    };
  });

  return NextResponse.json({ items });
}
