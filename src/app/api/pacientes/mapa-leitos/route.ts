import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { buildBedMapPayload } from "@/lib/inpatient/bed-map-data";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  try {
    const payload = await buildBedMapPayload(supabase, adminId);
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao carregar mapa de leitos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
