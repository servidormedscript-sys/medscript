import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

export async function GET() {
  const auth = await getSessionWithAdmin();
  if ("error" in auth && auth.error) return auth.error;

  return NextResponse.json({ profile: auth.profile });
}

export async function PATCH(request: Request) {
  const auth = await getSessionWithAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json()) as {
    full_name?: string;
    phone?: string;
    bio?: string;
    specialty?: string;
  };

  const updates: Record<string, string | null> = {};

  if (body.full_name !== undefined) {
    const fullName = body.full_name.trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 },
      );
    }
    updates.full_name = fullName;
  }

  if (body.phone !== undefined) {
    updates.phone = body.phone.trim() || null;
  }

  if (body.bio !== undefined) {
    const bio = body.bio.trim();
    if (bio.length > 500) {
      return NextResponse.json(
        { error: "A bio deve ter no máximo 500 caracteres." },
        { status: 400 },
      );
    }
    updates.bio = bio;
  }

  if (body.specialty !== undefined) {
    const specialty = body.specialty.trim();
    if (specialty.length > 120) {
      return NextResponse.json(
        { error: "A especialidade deve ter no máximo 120 caracteres." },
        { status: 400 },
      );
    }
    updates.specialty = specialty;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: "Nenhum campo para atualizar." },
      { status: 400 },
    );
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.user!.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
