import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatShiftRange } from "@/lib/agenda/format";

type RouteContext = { params: Promise<{ id: string }> };

const SHIFT_SELECT = `
  id,
  admin_id,
  member_id,
  shift_date,
  start_time,
  end_time,
  notes,
  created_by,
  created_at,
  updated_at,
  member:profiles!shift_schedules_member_id_fkey (
    id,
    full_name,
    email,
    user_type
  )
`;

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id } = await context.params;

  let body: {
    member_id?: string;
    shift_date?: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.member_id) {
    const { data: member } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", body.member_id)
      .eq("parent_admin_id", user!.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Sub-usuário inválido." }, { status: 400 });
    }

    updates.member_id = body.member_id;
  }

  if (body.shift_date) updates.shift_date = body.shift_date;
  if (body.start_time) updates.start_time = body.start_time;
  if (body.end_time) updates.end_time = body.end_time;
  if (body.notes !== undefined) updates.notes = body.notes.trim();

  const { data: shift, error } = await supabase
    .from("shift_schedules")
    .update(updates)
    .eq("id", id)
    .eq("admin_id", user!.id)
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminClient = createAdminClient();
  await adminClient.from("user_notifications").insert({
    recipient_id: shift.member_id,
    notification_type: "shift_assigned",
    title: "Plantão atualizado",
    body: formatShiftRange(shift.shift_date, shift.start_time, shift.end_time),
    payload: {
      shift_id: shift.id,
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
    },
  });

  return NextResponse.json({ shift });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;
  const { id } = await context.params;

  const { error } = await supabase
    .from("shift_schedules")
    .delete()
    .eq("id", id)
    .eq("admin_id", user!.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
