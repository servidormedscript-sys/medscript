import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeMedReconciliation } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { id?: string; action?: "manter" | "suspender" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const { supabase, user } = result.session;

  const { data: item } = await supabase
    .from("episode_med_reconciliation")
    .select("*")
    .eq("id", body.id)
    .eq("episode_id", episodeId)
    .single();

  if (!item || item.status !== "pendente") {
    return NextResponse.json(
      { error: "Item não encontrado ou já decidido." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  if (body.action === "suspender") {
    const { data: updated, error } = await supabase
      .from("episode_med_reconciliation")
      .update({
        status: "suspensa",
        decided_at: now,
        decided_by: user.id,
      })
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      item: mapRecon(updated as Record<string, unknown>),
    });
  }

  const { data: rx, error: rxError } = await supabase
    .from("episode_prescriptions")
    .insert({
      episode_id: episodeId,
      name: item.medication_text,
      dose: "",
      route: "VO",
      frequency: "conforme uso domiciliar",
      indication: "Uso domiciliar — reconciliação",
      use_continuous: true,
      duration_days: null,
      started_at: now,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (rxError || !rx) {
    return NextResponse.json(
      { error: rxError?.message ?? "Erro ao criar prescrição." },
      { status: 500 },
    );
  }

  const { data: updated, error } = await supabase
    .from("episode_med_reconciliation")
    .update({
      status: "mantida",
      decided_at: now,
      decided_by: user.id,
      linked_prescription_id: rx.id,
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    item: mapRecon(updated as Record<string, unknown>),
    prescriptionId: rx.id,
  });
}
