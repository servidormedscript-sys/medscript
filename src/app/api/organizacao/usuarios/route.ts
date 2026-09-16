import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserType } from "@/lib/types/profile";

const USER_FIELDS =
  "id, full_name, email, phone, user_type, role, created_at";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("profiles")
    .select(USER_FIELDS)
    .eq("parent_admin_id", session.adminId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { user } = auth;

  let body: {
    full_name?: string;
    email?: string;
    password?: string;
    phone?: string;
    user_type?: UserType;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { full_name, email, password, phone, user_type } = body;

  if (!full_name?.trim() || !email?.trim() || !password || !user_type) {
    return NextResponse.json(
      { error: "Nome, e-mail, senha e tipo de usuário são obrigatórios." },
      { status: 400 }
    );
  }

  if (!["plantonista", "estudante"].includes(user_type)) {
    return NextResponse.json({ error: "Tipo de usuário inválido." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter no mínimo 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    const adminClient = createAdminClient();

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          role: "member",
          user_type,
          parent_admin_id: user!.id,
          phone: phone?.trim() ?? null,
        },
      });

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Erro ao criar usuário." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: full_name.trim(),
        phone: phone?.trim() ?? null,
        role: "member",
        user_type,
        parent_admin_id: user!.id,
      })
      .eq("id", newUser.user.id)
      .select("*")
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ user: profile }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro interno ao criar usuário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
