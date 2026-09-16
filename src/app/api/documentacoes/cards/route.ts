import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { hashDocPassword } from "@/lib/documentation/password";
import type { DocumentationCardPublic } from "@/lib/documentation/types";
import { isAdmin } from "@/lib/auth/get-session-profile";

const CARD_SELECT = `
  id,
  admin_id,
  title,
  description,
  is_protected,
  sort_order,
  created_at,
  updated_at,
  documentation_files (
    id,
    card_id,
    file_name,
    storage_path,
    file_size,
    mime_type,
    created_at
  )
`;

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data, error } = await supabase
    .from("documentation_cards")
    .select(CARD_SELECT)
    .eq("admin_id", adminId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cards: DocumentationCardPublic[] = (data ?? []).map((card) => {
    const files = card.documentation_files ?? [];
    const { documentation_files: _files, ...rest } = card;
    return {
      ...rest,
      file_count: files.length,
      documentation_files: files,
    };
  });

  return NextResponse.json({
    cards,
    isAdmin: isAdmin(session.profile),
  });
}

export async function POST(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;

  let body: {
    title?: string;
    description?: string;
    is_protected?: boolean;
    password?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const title = body.title?.trim();
  const description = body.description?.trim() ?? "";
  const isProtected = Boolean(body.is_protected);

  if (!title) {
    return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
  }

  if (isProtected && !body.password?.trim()) {
    return NextResponse.json(
      { error: "Informe uma senha para cards privados." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("documentation_cards")
    .insert({
      admin_id: user!.id,
      title,
      description,
      is_protected: isProtected,
      password_hash: isProtected ? hashDocPassword(body.password!.trim()) : null,
    })
    .select(CARD_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const files = data.documentation_files ?? [];
  const { documentation_files: _files, ...rest } = data;

  return NextResponse.json({
    card: {
      ...rest,
      file_count: files.length,
      documentation_files: files,
    },
  });
}
