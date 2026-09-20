import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/platform/require-super-admin";
import { IMPERSONATE_COOKIE } from "@/lib/platform/super-admin";

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json()) as { adminId?: string };
  const adminId = body.adminId?.trim();
  if (!adminId) {
    return NextResponse.json({ error: "Informe o admin da clínica." }, { status: 400 });
  }

  const { admin } = auth;
  const { data: target } = await admin
    .from("profiles")
    .select("id, role, platform_role, full_name, email")
    .eq("id", adminId)
    .single();

  if (!target || target.platform_role || target.role !== "admin") {
    return NextResponse.json({ error: "Admin de clínica inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, adminId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}

export async function DELETE() {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);

  return NextResponse.json({ ok: true, redirectTo: "/dashboard/admin-plataforma" });
}
