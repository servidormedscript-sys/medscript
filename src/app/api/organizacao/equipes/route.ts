import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const TEAM_SELECT = `
  id,
  name,
  description,
  admin_id,
  created_at,
  updated_at,
  organization_members (
    id,
    profile_id,
    profile:profiles (
      id,
      full_name,
      email,
      user_type
    )
  )
`;

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("organizations")
    .select(TEAM_SELECT)
    .eq("admin_id", session.adminId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teams: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;

  let body: { name?: string; description?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Nome da equipe é obrigatório." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      description: body.description?.trim() || null,
      admin_id: user!.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data }, { status: 201 });
}
