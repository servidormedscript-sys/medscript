import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth/get-session-profile";
import { verifyDocPassword } from "@/lib/documentation/password";

type RouteContext = { params: Promise<{ fileId: string }> };

async function getFileWithAccess(fileId: string, password?: string) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) {
    return { error: session.error };
  }

  const { supabase, adminId, profile } = session;

  const { data: file, error } = await supabase
    .from("documentation_files")
    .select(
      `
      id,
      file_name,
      storage_path,
      mime_type,
      card:documentation_cards!inner (
        id,
        admin_id,
        is_protected,
        password_hash
      )
    `
    )
    .eq("id", fileId)
    .single();

  if (error || !file) {
    return {
      error: NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 }),
    };
  }

  const cardRaw = file.card;
  const card = (Array.isArray(cardRaw) ? cardRaw[0] : cardRaw) as {
    id: string;
    admin_id: string;
    is_protected: boolean;
    password_hash: string | null;
  };

  if (card.admin_id !== adminId) {
    return {
      error: NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 }),
    };
  }

  if (card.is_protected && !isAdmin(profile)) {
    if (!password?.trim()) {
      return {
        error: NextResponse.json({ error: "Senha necessária." }, { status: 403 }),
      };
    }

    if (!card.password_hash || !verifyDocPassword(password.trim(), card.password_hash)) {
      return {
        error: NextResponse.json({ error: "Senha incorreta." }, { status: 403 }),
      };
    }
  }

  return { file, supabase };
}

export async function GET(request: Request, context: RouteContext) {
  const { fileId } = await context.params;
  const password = new URL(request.url).searchParams.get("password") ?? undefined;

  const access = await getFileWithAccess(fileId, password);
  if ("error" in access && access.error) return access.error;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("clinic-documents")
    .createSignedUrl(access.file!.storage_path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Erro ao gerar link de download." }, { status: 500 });
  }

  return NextResponse.json({
    url: data.signedUrl,
    file_name: access.file!.file_name,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { fileId } = await context.params;

  const { data: file, error: fetchError } = await supabase
    .from("documentation_files")
    .select(
      `
      id,
      storage_path,
      card:documentation_cards!inner (admin_id)
    `
    )
    .eq("id", fileId)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const cardRaw = file.card;
  const card = (Array.isArray(cardRaw) ? cardRaw[0] : cardRaw) as { admin_id: string };
  if (card.admin_id !== user!.id) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const { error } = await supabase.from("documentation_files").delete().eq("id", fileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminClient = createAdminClient();
  await adminClient.storage.from("clinic-documents").remove([file.storage_path]);

  return NextResponse.json({ ok: true });
}
