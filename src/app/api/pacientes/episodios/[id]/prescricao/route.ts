import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { DEFAULT_GENERAL_ORDERS } from "@/lib/inpatient/prescricao-defaults";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type {
  EpisodeGeneralOrders,
  EpisodeMedReconciliation,
  EpisodePrescription,
  PrescriptionInput,
} from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapRx(row: Record<string, unknown>): EpisodePrescription {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    name: String(row.name),
    dose: String(row.dose ?? ""),
    route: String(row.route ?? ""),
    frequency: String(row.frequency ?? ""),
    indication: String(row.indication ?? ""),
    duration_days: row.duration_days != null ? Number(row.duration_days) : null,
    use_continuous: Boolean(row.use_continuous),
    started_at: String(row.started_at),
    suspended_at: row.suspended_at != null ? String(row.suspended_at) : null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

function mapRecon(row: Record<string, unknown>): EpisodeMedReconciliation {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    medication_text: String(row.medication_text),
    status: row.status as EpisodeMedReconciliation["status"],
    decided_at: row.decided_at != null ? String(row.decided_at) : null,
    decided_by: row.decided_by != null ? String(row.decided_by) : null,
    linked_prescription_id:
      row.linked_prescription_id != null
        ? String(row.linked_prescription_id)
        : null,
    created_at: String(row.created_at),
  };
}

function splitHomeMeds(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function ensureReconciliation(
  supabase: SupabaseClient,
  episodeId: string,
  homeMeds: string | null,
) {
  const { data: existing } = await supabase
    .from("episode_med_reconciliation")
    .select("id")
    .eq("episode_id", episodeId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const lines = splitHomeMeds(homeMeds);
  if (lines.length === 0) return;

  await supabase.from("episode_med_reconciliation").insert(
    lines.map((medication_text) => ({
      episode_id: episodeId,
      medication_text,
      status: "pendente",
    })),
  );
}

async function ensureGeneralOrders(
  supabase: SupabaseClient,
  episodeId: string,
): Promise<EpisodeGeneralOrders> {
  const { data: row } = await supabase
    .from("episode_general_orders")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (row) {
    return {
      episode_id: String(row.episode_id),
      order_flags: (row.order_flags as Record<string, boolean>) ?? {},
      diet: String(row.diet),
      vitals_frequency: String(row.vitals_frequency),
      padua_score: (row.padua_score as Record<string, boolean>) ?? {},
      updated_at: String(row.updated_at),
    };
  }

  const defaults = DEFAULT_GENERAL_ORDERS(episodeId);
  const { data: inserted } = await supabase
    .from("episode_general_orders")
    .insert(defaults)
    .select("*")
    .single();

  return {
    episode_id: String(inserted!.episode_id),
    order_flags: (inserted!.order_flags as Record<string, boolean>) ?? {},
    diet: String(inserted!.diet),
    vitals_frequency: String(inserted!.vitals_frequency),
    padua_score: (inserted!.padua_score as Record<string, boolean>) ?? {},
    updated_at: String(inserted!.updated_at),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;
  const episode = result.episode;

  await ensureReconciliation(supabase, episodeId, episode.medications);
  const generalOrders = await ensureGeneralOrders(supabase, episodeId);

  const [rxRes, reconRes] = await Promise.all([
    supabase
      .from("episode_prescriptions")
      .select("*")
      .eq("episode_id", episodeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("episode_med_reconciliation")
      .select("*")
      .eq("episode_id", episodeId)
      .order("created_at", { ascending: true }),
  ]);

  if (rxRes.error || reconRes.error) {
    return NextResponse.json(
      { error: rxRes.error?.message ?? reconRes.error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    prescriptions: (rxRes.data ?? []).map((r) =>
      mapRx(r as Record<string, unknown>),
    ),
    reconciliation: (reconRes.data ?? []).map((r) =>
      mapRecon(r as Record<string, unknown>),
    ),
    generalOrders,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: PrescriptionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Nome da medicação é obrigatório." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;

  const { data: row, error } = await supabase
    .from("episode_prescriptions")
    .insert({
      episode_id: episodeId,
      name,
      dose: body.dose?.trim() ?? "",
      route: body.route?.trim() ?? "",
      frequency: body.frequency?.trim() ?? "",
      indication: body.indication?.trim() ?? "",
      duration_days: body.use_continuous ? null : body.duration_days ?? null,
      use_continuous: Boolean(body.use_continuous),
      started_at: body.started_at ?? new Date().toISOString(),
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const prescription = mapRx(row as Record<string, unknown>);
  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "prescricao_inicio",
    summary_text: `Início: ${prescription.name} ${prescription.dose}`.trim(),
    occurred_at: prescription.started_at,
    source_id: prescription.id,
  });

  return NextResponse.json({ prescription });
}
