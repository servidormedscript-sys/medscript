import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  AVATAR_BUCKET,
  extractAvatarStoragePath,
} from "@/lib/profile/avatar";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await getSessionWithAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Selecione uma imagem válida." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no máximo 2 MB." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPG, PNG ou WebP." },
      { status: 400 },
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const storagePath = `${auth.user!.id}/avatar.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const adminClient = createAdminClient();

  const oldPath = extractAvatarStoragePath(auth.profile.avatar_url);
  if (oldPath && oldPath.startsWith(`${auth.user!.id}/`)) {
    await adminClient.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  const { error: uploadError } = await adminClient.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { data: profile, error: updateError } = await auth.supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", auth.user!.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ profile, avatar_url: avatarUrl });
}
