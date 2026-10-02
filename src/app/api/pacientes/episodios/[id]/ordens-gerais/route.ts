import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { DEFAULT_GENERAL_ORDERS } from "@/lib/inpatient/prescricao-defaults";
import type { EpisodeGeneralOrders } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapOrders(row: Record<string, unknown>): EpisodeGeneralOrders {
  return {
    episode_id: String(row.episode_id),
    order_flags: (row.order_flags as Record<string, boolean>) ?? {},
    diet: String(row.diet),
    vitals_frequency: String(row.vitals_frequency),
    padua_score: (row.padua_score as Record<string, boolean>) ?? {},
    caprini_score: (row.caprini_score as Record<string, boolean>) ?? {},
    updated_at: String(row.updated_at),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: Partial<EpisodeGeneralOrders>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { supabase } = result.session;

  const { data: existing } = await supabase
    .from("episode_general_orders")
    .select("episode_id")
    .eq("episode_id", episodeId)
    .maybeSingle();

  const payload = {
    order_flags: body.order_flags,
    diet: body.diet,
    vitals_frequency: body.vitals_frequency,
    padua_score: body.padua_score,
    caprini_score: body.caprini_score,
    updated_at: new Date().toISOString(),
  };

  if (!existing) {
    const defaults = DEFAULT_GENERAL_ORDERS(episodeId);
    const { data: row, error } = await supabase
      .from("episode_general_orders")
      .insert({ ...defaults, ...payload })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ generalOrders: mapOrders(row as Record<string, unknown>) });
  }

  const { data: row, error } = await supabase
    .from("episode_general_orders")
    .update(payload)
    .eq("episode_id", episodeId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    generalOrders: mapOrders(row as Record<string, unknown>),
  });
}
