import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { loadClinicalBundles } from "@/lib/inpatient/load-clinical-bundles";
import {
  buildFullHandoffText,
  type PassagemEpisodeRow,
} from "@/lib/inpatient/passagem-plantao";
import type { CodeStatus, EpisodeHandoffTask } from "@/lib/types/inpatient-chart";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data: episodes, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      id,
      bed,
      diagnosis,
      created_at,
      organization_bed_id,
      patient:patients!inner (full_name, birth_date, admin_id)
    `,
    )
    .eq("status", "internado")
    .is("archived_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  function episodePatient(
    patient: unknown,
  ): { full_name: string; birth_date: string | null; admin_id?: string } | null {
    if (!patient) return null;
    if (Array.isArray(patient)) {
      return (patient[0] as {
        full_name: string;
        birth_date: string | null;
        admin_id?: string;
      }) ?? null;
    }
    return patient as {
      full_name: string;
      birth_date: string | null;
      admin_id?: string;
    };
  }

  const internados = (episodes ?? []).filter((e) => {
    const p = episodePatient(e.patient);
    return p?.admin_id === adminId;
  });

  if (internados.length === 0) {
    return NextResponse.json({
      text: "PASSAGEM DE PLANTÃO — nenhum paciente internado no momento.",
    });
  }

  const ids = internados.map((e) => e.id);

  const [conductRes, tasksRes, bedsRes, evRes, bundles] = await Promise.all([
    supabase.from("episode_conduct").select("*").in("episode_id", ids),
    supabase.from("episode_handoff_tasks").select("*").in("episode_id", ids),
    supabase
      .from("organization_beds")
      .select("id, unit, episode_id")
      .eq("admin_id", adminId),
    supabase
      .from("episode_evolutions")
      .select("episode_id, content_html, created_at")
      .in("episode_id", ids)
      .order("created_at", { ascending: false }),
    loadClinicalBundles(supabase, ids),
  ]);

  const conductByEp = new Map(
    (conductRes.data ?? []).map((c) => [c.episode_id, c]),
  );
  const tasksByEp = new Map<string, EpisodeHandoffTask[]>();
  for (const t of tasksRes.data ?? []) {
    const list = tasksByEp.get(t.episode_id) ?? [];
    list.push({
      id: t.id,
      episode_id: t.episode_id,
      text: t.text,
      completed: t.completed,
      created_by: t.created_by,
      created_at: t.created_at,
      completed_at: t.completed_at,
    });
    tasksByEp.set(t.episode_id, list);
  }

  const bedUnitByEpisode = new Map<string, string>();
  for (const b of bedsRes.data ?? []) {
    if (b.episode_id) bedUnitByEpisode.set(b.episode_id, b.unit || "Sem setor");
  }

  const lastEvByEp = new Map<string, string>();
  for (const ev of evRes.data ?? []) {
    if (!lastEvByEp.has(ev.episode_id)) {
      lastEvByEp.set(ev.episode_id, ev.content_html);
    }
  }

  const rows: PassagemEpisodeRow[] = internados.map((ep) => {
    const conduct = conductByEp.get(ep.id);
    const p = episodePatient(ep.patient)!;
    return {
      id: ep.id,
      bed: ep.bed,
      diagnosis: ep.diagnosis,
      created_at: ep.created_at,
      patient_name: p.full_name,
      birth_date: p.birth_date,
      unit: bedUnitByEpisode.get(ep.id) ?? "Sem setor",
      code_status: (conduct?.code_status as CodeStatus) ?? "reanimacao_plena",
      contingency_plan: conduct?.contingency_plan ?? "",
      tasks: tasksByEp.get(ep.id) ?? [],
      last_evolution_html: lastEvByEp.get(ep.id) ?? null,
    };
  });

  const text = buildFullHandoffText(rows, bundles);
  return NextResponse.json({ text });
}
