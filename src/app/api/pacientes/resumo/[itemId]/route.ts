import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { ALLOWED_DOSE_INTERVALS } from "@/lib/medication-schedule";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeScheduleTime,
  parseScheduleTimes,
  type PatientExamStatus,
} from "@/lib/types/patient-care";

type RouteContext = { params: Promise<{ itemId: string }> };

async function getCareItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  itemId: string
) {
  const { data } = await supabase
    .from("patient_care_items")
    .select("*")
    .eq("id", itemId)
    .eq("admin_id", adminId)
    .single();

  return data;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { itemId } = await context.params;

  const existing = await getCareItem(supabase, adminId!, itemId);
  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  let body: {
    title?: string;
    notes?: string;
    completion_notes?: string;
    exam_status?: PatientExamStatus;
    scheduled_for?: string | null;
    schedule_times?: string[] | string;
    dose_interval_hours?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Informe um título." }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes.trim() || null;
  }

  if (existing.item_type === "exame") {
    if (body.exam_status !== undefined) {
      if (!["pendente", "realizado", "cancelado"].includes(body.exam_status)) {
        return NextResponse.json({ error: "Status de exame inválido." }, { status: 400 });
      }
      updates.exam_status = body.exam_status;
      if (body.exam_status === "realizado") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
        updates.completion_notes = null;
      }
    }

    if (body.completion_notes !== undefined) {
      updates.completion_notes = body.completion_notes.trim() || null;
    }

    if (body.scheduled_for !== undefined) {
      updates.scheduled_for = body.scheduled_for
        ? new Date(body.scheduled_for).toISOString()
        : null;
    }
  }

  if (existing.item_type === "medicamento" && body.dose_interval_hours !== undefined) {
    const intervalHours = Number(body.dose_interval_hours);
    if (
      !ALLOWED_DOSE_INTERVALS.includes(intervalHours as (typeof ALLOWED_DOSE_INTERVALS)[number])
    ) {
      return NextResponse.json(
        { error: "Selecione um intervalo válido entre doses." },
        { status: 400 }
      );
    }
    updates.dose_interval_hours = intervalHours;
  }

  if (existing.item_type === "medicamento" && body.schedule_times !== undefined) {
    const scheduleTimes = Array.isArray(body.schedule_times)
      ? body.schedule_times
      : parseScheduleTimes(body.schedule_times);

    const normalized = scheduleTimes
      .map((time) => normalizeScheduleTime(time))
      .filter(Boolean);

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "Informe ao menos um horário válido (HH:MM)." },
        { status: 400 }
      );
    }

    updates.schedule_times = normalized;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from("patient_care_items")
    .update(updates)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { itemId } = await context.params;

  const existing = await getCareItem(supabase, adminId!, itemId);
  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  const { error } = await supabase.from("patient_care_items").delete().eq("id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
