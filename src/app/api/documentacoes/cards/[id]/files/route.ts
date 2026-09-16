import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id: cardId } = await context.params;

  const { data: card, error: cardError } = await supabase
    .from("documentation_cards")
    .select("id")
    .eq("id", cardId)
    .eq("admin_id", user!.id)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card não encontrado." }, { status: 404 });
  }

  const formData = await request.formData();
  const entries = formData.getAll("files");

  if (!entries.length) {
    return NextResponse.json({ error: "Selecione ao menos um arquivo." }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const uploaded = [];

  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size === 0) continue;

    if (entry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo "${entry.name}" excede o limite de 10 MB.` },
        { status: 400 }
      );
    }

    const safeName = entry.name.replace(/[^\w.\-() ]+/g, "_");
    const storagePath = `${user!.id}/${cardId}/${crypto.randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await entry.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("clinic-documents")
      .upload(storagePath, buffer, {
        contentType: entry.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: fileRow, error: insertError } = await supabase
      .from("documentation_files")
      .insert({
        card_id: cardId,
        file_name: entry.name,
        storage_path: storagePath,
        file_size: entry.size,
        mime_type: entry.type || null,
      })
      .select("*")
      .single();

    if (insertError) {
      await adminClient.storage.from("clinic-documents").remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    uploaded.push(fileRow);
  }

  if (!uploaded.length) {
    return NextResponse.json({ error: "Nenhum arquivo válido enviado." }, { status: 400 });
  }

  return NextResponse.json({ files: uploaded });
}
