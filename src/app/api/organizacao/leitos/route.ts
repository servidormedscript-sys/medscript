import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { getSessionWithAdmin } from "@/lib/api/require-session";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data, error } = await supabase
    .from("organization_beds")
    .select("*")
    .eq("admin_id", adminId)
    .order("unit", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ beds: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;

  let body: { code?: string; unit?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Código do leito é obrigatório." }, { status: 400 });
  }

  const unit = body.unit?.trim() ?? "";

  const { data, error } = await supabase
    .from("organization_beds")
    .insert({
      admin_id: user!.id,
      code,
      unit,
      status: "livre",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bed: data }, { status: 201 });
}
