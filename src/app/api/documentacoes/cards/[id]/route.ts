import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashDocPassword } from "@/lib/documentation/password";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id } = await context.params;

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

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.description !== undefined) {
    updates.description = body.description.trim();
  }

  if (body.is_protected !== undefined) {
    updates.is_protected = body.is_protected;
    if (body.is_protected) {
      if (!body.password?.trim()) {
        return NextResponse.json(
          { error: "Informe uma senha para tornar o card privado." },
          { status: 400 }
        );
      }
      updates.password_hash = hashDocPassword(body.password.trim());
    } else {
      updates.password_hash = null;
    }
  } else if (body.password?.trim()) {
    updates.password_hash = hashDocPassword(body.password.trim());
    updates.is_protected = true;
  }

  const { data, error } = await supabase
    .from("documentation_cards")
    .update(updates)
    .eq("id", id)
    .eq("admin_id", user!.id)
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

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id } = await context.params;

  const { data: files } = await supabase
    .from("documentation_files")
    .select("storage_path")
    .eq("card_id", id);

  const { error } = await supabase
    .from("documentation_cards")
    .delete()
    .eq("id", id)
    .eq("admin_id", user!.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (files?.length) {
    const adminClient = createAdminClient();
    await adminClient.storage
      .from("clinic-documents")
      .remove(files.map((file) => file.storage_path));
  }

  return NextResponse.json({ ok: true });
}
