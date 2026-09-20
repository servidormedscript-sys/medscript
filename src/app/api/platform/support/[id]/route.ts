import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/require-super-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: "open" | "in_progress" | "closed";
    admin_notes?: string;
  };

  const { admin } = auth;
  const { error } = await admin
    .from("support_messages")
    .update({
      status: body.status,
      admin_notes: body.admin_notes?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar chamado." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
