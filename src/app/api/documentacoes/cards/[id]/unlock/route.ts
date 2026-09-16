import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { verifyDocPassword } from "@/lib/documentation/password";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id } = await context.params;

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const password = body.password?.trim();
  if (!password) {
    return NextResponse.json({ error: "Senha é obrigatória." }, { status: 400 });
  }

  const { data: card, error } = await supabase
    .from("documentation_cards")
    .select("id, is_protected, password_hash")
    .eq("id", id)
    .eq("admin_id", adminId)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: "Card não encontrado." }, { status: 404 });
  }

  if (!card.is_protected) {
    return NextResponse.json({ unlocked: true });
  }

  if (!card.password_hash || !verifyDocPassword(password, card.password_hash)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 403 });
  }

  return NextResponse.json({ unlocked: true });
}
