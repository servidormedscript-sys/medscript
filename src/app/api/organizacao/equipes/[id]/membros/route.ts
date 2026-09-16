import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id: teamId } = await context.params;

  let body: { profile_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const profileId = body.profile_id;
  if (!profileId) {
    return NextResponse.json({ error: "Usuário é obrigatório." }, { status: 400 });
  }

  const { data: team } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", teamId)
    .eq("admin_id", user!.id)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Equipe não encontrada." }, { status: 404 });
  }

  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("parent_admin_id", user!.id)
    .single();

  if (!memberProfile) {
    return NextResponse.json(
      { error: "Usuário não pertence à sua organização." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: teamId,
      profile_id: profileId,
    })
    .select(
      `
      id,
      profile_id,
      profile:profiles (
        id,
        full_name,
        email,
        user_type
      )
    `
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este usuário já faz parte desta equipe." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id: teamId } = await context.params;

  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profile_id");

  if (!profileId) {
    return NextResponse.json({ error: "profile_id é obrigatório." }, { status: 400 });
  }

  const { data: team } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", teamId)
    .eq("admin_id", user!.id)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Equipe não encontrada." }, { status: 404 });
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", teamId)
    .eq("profile_id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
