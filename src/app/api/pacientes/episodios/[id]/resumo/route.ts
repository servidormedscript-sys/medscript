import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  ALLOWED_DOSE_INTERVALS,
  scheduleTimeFromDate,
} from "@/lib/medication-schedule";
import { createClient } from "@/lib/supabase/server";
import {
  todayDateString,
  type PatientCareItemType,
} from "@/lib/types/patient-care";

type RouteContext = { params: Promise<{ id: string }> };

async function getEpisodeForAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  episodeId: string
) {
  const { data: episode } = await supabase
    .from("patient_episodes")
    .select("id, patient:patients!inner(admin_id)")
    .eq("id", episodeId)
    .single();

  const patient = Array.isArray(episode?.patient)
    ? episode?.patient[0]
    : episode?.patient;

  if (!episode || patient?.admin_id !== adminId) {
    return null;
  }

  return episode;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: episodeId } = await context.params;

  const episode = await getEpisodeForAdmin(supabase, adminId!, episodeId);
  if (!episode) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const today = todayDateString();

  const { data: items, error } = await supabase
    .from("patient_care_items")
    .select(
      `
      *,
      medication_doses:patient_medication_doses (*)
    `
    )
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (items ?? []).map((item) => ({
    ...item,
    medication_doses: (item.medication_doses ?? []).filter(
      (dose: { dose_date: string }) => dose.dose_date === today
    ),
  }));

  return NextResponse.json({ items: enriched, today });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;
  const { id: episodeId } = await context.params;

  const episode = await getEpisodeForAdmin(supabase, adminId!, episodeId);
  if (!episode) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  let body: {
    item_type?: PatientCareItemType;
    title?: string;
    notes?: string;
    scheduled_for?: string;
    schedule_times?: string[] | string;
    dose_interval_hours?: number;
    register_dose_now?: boolean;
    dose_notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const itemType = body.item_type;
  const title = body.title?.trim();

  if (!itemType || !["exame", "medicamento"].includes(itemType)) {
    return NextResponse.json({ error: "Tipo de solicitação inválido." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Informe um título." }, { status: 400 });
  }

  const insertData: Record<string, unknown> = {
    episode_id: episodeId,
    admin_id: adminId,
    item_type: itemType,
    title,
    notes: body.notes?.trim() || null,
    created_by: user!.id,
  };

  if (itemType === "exame") {
    insertData.exam_status = "pendente";
    insertData.scheduled_for = body.scheduled_for
      ? new Date(body.scheduled_for).toISOString()
      : null;
    insertData.schedule_times = [];
  } else {
    const intervalHours = Number(body.dose_interval_hours);

    if (!ALLOWED_DOSE_INTERVALS.includes(intervalHours as (typeof ALLOWED_DOSE_INTERVALS)[number])) {
      return NextResponse.json(
        { error: "Selecione um intervalo válido entre doses." },
        { status: 400 }
      );
    }

    insertData.dose_interval_hours = intervalHours;
    insertData.schedule_times = [];
    insertData.exam_status = null;

    if (body.register_dose_now) {
      const now = new Date();
      insertData.last_dose_at = now.toISOString();
    }
  }

  const { data: item, error } = await supabase
    .from("patient_care_items")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (itemType === "medicamento" && body.register_dose_now) {
    const now = new Date();
    const scheduleTime = scheduleTimeFromDate(now);
    const doseDate = todayDateString(now);

    await supabase.from("patient_medication_doses").insert({
      care_item_id: item.id,
      dose_date: doseDate,
      schedule_time: scheduleTime,
      taken_at: now.toISOString(),
      notes: body.dose_notes?.trim() || null,
      created_by: user!.id,
    });
  }

  return NextResponse.json({ item }, { status: 201 });
}
