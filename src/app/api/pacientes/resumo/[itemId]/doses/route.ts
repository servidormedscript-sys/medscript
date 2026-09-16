import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { scheduleTimeFromDate } from "@/lib/medication-schedule";
import { normalizeScheduleTime, todayDateString } from "@/lib/types/patient-care";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;
  const { itemId } = await context.params;

  const { data: item } = await supabase
    .from("patient_care_items")
    .select("*")
    .eq("id", itemId)
    .eq("admin_id", adminId!)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Medicamento não encontrado." }, { status: 404 });
  }

  if (item.item_type !== "medicamento") {
    return NextResponse.json({ error: "Este item não é um medicamento." }, { status: 400 });
  }

  let body: {
    schedule_time?: string;
    dose_date?: string;
    taken?: boolean;
    take_now?: boolean;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const taken = body.taken !== false;
  const now = new Date();
  let scheduleTime: string | null = null;
  let doseDate = body.dose_date ?? todayDateString(now);
  const notes = body.notes?.trim() || null;

  if (item.dose_interval_hours) {
    if (!taken) {
      return NextResponse.json(
        { error: "Use o registro de tomada atual para medicamentos com intervalo." },
        { status: 400 }
      );
    }

    if (!body.take_now) {
      return NextResponse.json(
        { error: "Informe take_now para registrar a tomada atual." },
        { status: 400 }
      );
    }

    scheduleTime = scheduleTimeFromDate(now);
    doseDate = todayDateString(now);
  } else {
    scheduleTime = normalizeScheduleTime(body.schedule_time ?? "");
    if (!scheduleTime) {
      return NextResponse.json({ error: "Horário inválido." }, { status: 400 });
    }

    if (!(item.schedule_times ?? []).includes(scheduleTime)) {
      return NextResponse.json(
        { error: "Horário não pertence a este medicamento." },
        { status: 400 }
      );
    }
  }

  const { data: dose, error } = await supabase
    .from("patient_medication_doses")
    .upsert(
      {
        care_item_id: itemId,
        dose_date: doseDate,
        schedule_time: scheduleTime,
        taken_at: taken ? now.toISOString() : null,
        notes: taken ? notes : null,
        created_by: user!.id,
      },
      { onConflict: "care_item_id,dose_date,schedule_time" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (taken && item.dose_interval_hours) {
    const { error: updateError } = await supabase
      .from("patient_care_items")
      .update({ last_dose_at: now.toISOString() })
      .eq("id", itemId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ dose });
}
