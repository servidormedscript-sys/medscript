import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { dismiss?: boolean; read?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const updates: Record<string, string> = {};
  const now = new Date().toISOString();

  if (body.dismiss) updates.dismissed_at = now;
  if (body.read) updates.read_at = now;

  const { data, error } = await supabase
    .from("user_notifications")
    .update(updates)
    .eq("id", id)
    .eq("recipient_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notification: data });
}
