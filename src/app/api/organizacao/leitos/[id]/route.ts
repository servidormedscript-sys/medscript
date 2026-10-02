import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { setOrganizationBedStatus } from "@/lib/inpatient/bed-sync";
import type { OrganizationBedStatus } from "@/lib/types/organization-bed";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES: OrganizationBedStatus[] = [
  "livre",
  "ocupado",
  "higienizacao",
  "bloqueado",
];

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id } = await context.params;

  let body: {
    status?: OrganizationBedStatus;
    code?: string;
    unit?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    const err = await setOrganizationBedStatus(
      supabase,
      adminId,
      id,
      body.status,
    );
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  const updates: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (body.code !== undefined) updates.code = body.code.trim();
  if (body.unit !== undefined) updates.unit = body.unit.trim();

  if (body.code !== undefined || body.unit !== undefined) {
    const auth = await getAdminFromRequest();
    if ("error" in auth && auth.error) return auth.error;

    const { error } = await auth.supabase
      .from("organization_beds")
      .update(updates)
      .eq("id", id)
      .eq("admin_id", adminId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: bed, error: fetchError } = await supabase
    .from("organization_beds")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ bed });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id } = await context.params;

  const { data: bed } = await supabase
    .from("organization_beds")
    .select("status")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!bed) {
    return NextResponse.json({ error: "Leito não encontrado." }, { status: 404 });
  }

  if (bed.status === "ocupado") {
    return NextResponse.json(
      { error: "Não é possível excluir um leito ocupado." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("organization_beds")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
