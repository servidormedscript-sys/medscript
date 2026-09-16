import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatShiftRange } from "@/lib/agenda/format";
import { isAdmin } from "@/lib/auth/get-session-profile";

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

export async function GET(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, profile, user } = session;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = supabase
    .from("shift_schedules")
    .select(SHIFT_SELECT)
    .eq("admin_id", adminId)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!isAdmin(profile)) {
    query = query.eq("member_id", user!.id);
  }

  if (month && year) {
    const monthNum = Number(month);
    const yearNum = Number(year);
    const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const endDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    query = query.gte("shift_date", startDate).lte("shift_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    shifts: data ?? [],
    isAdmin: isAdmin(profile),
  });
}

export async function POST(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user } = auth;

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

  const { member_id, shift_date, start_time, end_time, notes } = body;

  if (!member_id || !shift_date || !start_time || !end_time) {
    return NextResponse.json(
      { error: "Sub-usuário, data e horários são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", member_id)
    .eq("parent_admin_id", user!.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Sub-usuário inválido." }, { status: 400 });
  }

  const { data: shift, error } = await supabase
    .from("shift_schedules")
    .insert({
      admin_id: user!.id,
      member_id,
      shift_date,
      start_time,
      end_time,
      notes: notes?.trim() ?? "",
      created_by: user!.id,
    })
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminClient = createAdminClient();
  await adminClient.from("user_notifications").insert({
    recipient_id: member_id,
    notification_type: "shift_assigned",
    title: "Novo plantão agendado",
    body: formatShiftRange(shift_date, start_time, end_time),
    payload: {
      shift_id: shift.id,
      shift_date,
      start_time,
      end_time,
    },
  });

  return NextResponse.json({ shift });
}
