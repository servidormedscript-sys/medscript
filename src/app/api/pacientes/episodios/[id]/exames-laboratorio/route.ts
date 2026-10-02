import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { computeCriticalLabConducts } from "@/lib/inpatient/lab-critical-conduct";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { getAnalyte } from "@/lib/inpatient/lab-analytes";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { refreshEpisodeRiskLevel } from "@/lib/inpatient/sync-episode-risk";
import type {
  EpisodeImagingReport,
  EpisodeLabPending,
  EpisodeLabValue,
} from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapValue(row: Record<string, unknown>): EpisodeLabValue {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    analyte_key: String(row.analyte_key),
    value: Number(row.value),
    collected_at: String(row.collected_at),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

function mapPending(row: Record<string, unknown>): EpisodeLabPending {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    label: String(row.label),
    analyte_key: row.analyte_key != null ? String(row.analyte_key) : null,
    requested_at: String(row.requested_at),
    expected_note:
      row.expected_note != null ? String(row.expected_note) : null,
    urgent: Boolean(row.urgent),
    fulfilled_at:
      row.fulfilled_at != null ? String(row.fulfilled_at) : null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

function mapImaging(row: Record<string, unknown>): EpisodeImagingReport {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    title: String(row.title),
    body_text: String(row.body_text),
    reported_at: String(row.reported_at),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const [vals, pending, imaging] = await Promise.all([
    supabase
      .from("episode_lab_values")
      .select("*")
      .eq("episode_id", episodeId)
      .order("collected_at", { ascending: false }),
    supabase
      .from("episode_lab_pending")
      .select("*")
      .eq("episode_id", episodeId)
      .is("fulfilled_at", null)
      .order("requested_at", { ascending: false }),
    supabase
      .from("episode_imaging_reports")
      .select("*")
      .eq("episode_id", episodeId)
      .order("reported_at", { ascending: false }),
  ]);

  if (vals.error || pending.error || imaging.error) {
    return NextResponse.json(
      {
        error:
          vals.error?.message ??
          pending.error?.message ??
          imaging.error?.message,
      },
      { status: 500 },
    );
  }

  const values = (vals.data ?? []).map((r) =>
    mapValue(r as Record<string, unknown>),
  );

  return NextResponse.json({
    values,
    pending: (pending.data ?? []).map((r) =>
      mapPending(r as Record<string, unknown>),
    ),
    imaging: (imaging.data ?? []).map((r) =>
      mapImaging(r as Record<string, unknown>),
    ),
    alerts: computeLabAlerts(values),
    criticalConducts: computeCriticalLabConducts(values),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: {
    collected_at?: string;
    entries?: { analyte_key: string; value: number }[];
    imaging?: { title?: string; body_text: string };
    fulfill_pending_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { supabase, user } = result.session;
  const collectedAt = body.collected_at ?? new Date().toISOString();

  if (body.imaging?.body_text?.trim()) {
    const { data: img, error } = await supabase
      .from("episode_imaging_reports")
      .insert({
        episode_id: episodeId,
        title: body.imaging.title?.trim() || "Laudo de imagem",
        body_text: body.imaging.body_text.trim(),
        reported_at: collectedAt,
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const imaging = mapImaging(img as Record<string, unknown>);
    await appendTimelineEvent(supabase, {
      episode_id: episodeId,
      event_type: "exame_imagem",
      summary_text: `Laudo: ${imaging.title}`,
      occurred_at: imaging.reported_at,
      source_id: imaging.id,
    });
    return NextResponse.json({ imaging });
  }

  const entries = body.entries ?? [];
  if (entries.length === 0) {
    return NextResponse.json(
      { error: "Informe ao menos um resultado." },
      { status: 400 },
    );
  }

  const rows = entries.map((e) => ({
    episode_id: episodeId,
    analyte_key: e.analyte_key,
    value: e.value,
    collected_at: collectedAt,
    created_by: user.id,
  }));

  const { data: inserted, error } = await supabase
    .from("episode_lab_values")
    .insert(rows)
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.fulfill_pending_id) {
    const fulfilledAt = new Date().toISOString();
    const { data: pendingRow } = await supabase
      .from("episode_lab_pending")
      .update({ fulfilled_at: fulfilledAt })
      .eq("id", body.fulfill_pending_id)
      .eq("episode_id", episodeId)
      .select("id, label")
      .maybeSingle();
    if (pendingRow?.label) {
      await appendTimelineEvent(supabase, {
        episode_id: episodeId,
        event_type: "exame_resultado",
        summary_text: `Resultado registrado: ${String(pendingRow.label)}`,
        occurred_at: collectedAt,
        source_id: String(pendingRow.id),
      });
    }
  }

  const values = (inserted ?? []).map((r) =>
    mapValue(r as Record<string, unknown>),
  );

  const summary = values
    .map((v) => {
      const def = getAnalyte(v.analyte_key);
      const label = def?.label ?? v.analyte_key;
      const unit = def?.unit ? ` ${def.unit}` : "";
      return `${label} ${v.value}${unit}`;
    })
    .join("; ");

  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "exame_lab",
    summary_text: summary || "Resultados laboratoriais registrados",
    occurred_at: collectedAt,
    source_id: values[0]?.id ?? null,
  });

  const patient = result.episode.patient;
  await refreshEpisodeRiskLevel(supabase, episodeId, {
    admissionAt: result.episode.created_at,
    birthDate: patient?.birth_date ?? null,
  });

  return NextResponse.json({ values });
}
