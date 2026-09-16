import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { fetchCareItemsByEpisode } from "@/lib/patient-care-fetch";
import type { KanbanEpisode, PatientSex, PatientStatus, RiskLevel } from "@/lib/types/patient";
import { INITIAL_KANBAN_OPTIONS, STATUS_LABELS } from "@/lib/types/patient";

function computeDaysRemaining(
  altaStartedAt: string | null,
  altaDays: number | null
): number | null {
  if (!altaStartedAt || !altaDays) return null;

  const start = new Date(altaStartedAt);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + altaDays);

  const diff = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, diff);
}

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  await supabase.rpc("archive_expired_alta_patients");

  const { data, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      *,
      patient:patients (*)
    `
    )
    .in("status", ["triagem", "em_observacao", "internado", "alta_recente"])
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = (data ?? []).filter((ep) => ep.patient?.admin_id === adminId);
  const episodeIds = filtered.map((ep) => ep.id);

  let summariesByEpisode: Record<string, NonNullable<KanbanEpisode["care_summary"]>> =
    {};

  try {
    const care = await fetchCareItemsByEpisode(supabase, episodeIds);
    summariesByEpisode = care.summariesByEpisode;
  } catch (careError) {
    const message =
      careError instanceof Error ? careError.message : "Erro ao carregar resumo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const episodes = filtered.map((ep) => ({
    ...ep,
    days_remaining: computeDaysRemaining(ep.alta_started_at, ep.alta_days),
    care_summary: summariesByEpisode[ep.id] ?? {
      pendingExamCount: 0,
      pendingMedDoseCount: 0,
      pendingExams: [],
      pendingMedDoses: [],
    },
  })) as KanbanEpisode[];

  const grouped = {
    triagem: episodes.filter((e) => e.status === "triagem"),
    em_observacao: episodes.filter((e) => e.status === "em_observacao"),
    internado: episodes.filter((e) => e.status === "internado"),
    alta_recente: episodes.filter((e) => e.status === "alta_recente"),
  };

  return NextResponse.json({ kanban: grouped, episodes });
}

export async function POST(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;

  let body: {
    full_name?: string;
    cpf?: string;
    birth_date?: string;
    sex?: PatientSex;
    weight?: string;
    bed?: string;
    diagnosis?: string;
    allergies?: string;
    medications?: string;
    initial_status?: PatientStatus;
    initial_assessment?: string;
    risk_level?: RiskLevel;
    alta_days?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  const cpf = body.cpf?.replace(/\D/g, "");
  const birthDate = body.birth_date;
  const sex = body.sex;
  const initialStatus = body.initial_status ?? "triagem";

  if (!fullName || !cpf || cpf.length !== 11) {
    return NextResponse.json(
      { error: "Nome completo e CPF válido (11 dígitos) são obrigatórios." },
      { status: 400 }
    );
  }

  if (!birthDate) {
    return NextResponse.json(
      { error: "Data de nascimento é obrigatória." },
      { status: 400 }
    );
  }

  if (!sex || !["masculino", "feminino", "outro"].includes(sex)) {
    return NextResponse.json({ error: "Sexo é obrigatório." }, { status: 400 });
  }

  if (!INITIAL_KANBAN_OPTIONS.includes(initialStatus)) {
    return NextResponse.json(
      { error: "Situação inicial inválida para cadastro." },
      { status: 400 }
    );
  }

  if (initialStatus === "internado" && !body.risk_level) {
    return NextResponse.json(
      { error: "Classificação de risco é obrigatória ao cadastrar como internado." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("patients")
    .select("id, is_archived")
    .eq("admin_id", adminId)
    .eq("cpf", cpf)
    .maybeSingle();

  if (existing && !existing.is_archived) {
    return NextResponse.json(
      { error: "Já existe um paciente ativo com este CPF." },
      { status: 400 }
    );
  }

  if (existing?.is_archived) {
    return NextResponse.json(
      {
        error:
          "Paciente arquivado encontrado. Use a aba Desarquivamento para reativar.",
        patient_id: existing.id,
      },
      { status: 409 }
    );
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      admin_id: adminId,
      full_name: fullName,
      cpf,
      birth_date: birthDate,
      sex,
      is_archived: false,
    })
    .select("*")
    .single();

  if (patientError || !patient) {
    return NextResponse.json(
      { error: patientError?.message ?? "Erro ao cadastrar paciente." },
      { status: 500 }
    );
  }

  const episodeData: Record<string, unknown> = {
    patient_id: patient.id,
    episode_number: 1,
    status: initialStatus,
    status_started_at: new Date().toISOString(),
    triagem_seconds: 0,
    observacao_seconds: 0,
    internado_seconds: 0,
    weight: body.weight?.trim() || null,    bed: body.bed?.trim() || null,
    diagnosis: body.diagnosis?.trim() || null,
    allergies: body.allergies?.trim() || null,
    medications: body.medications?.trim() || null,
    initial_assessment: body.initial_assessment?.trim() || null,
    created_by: user!.id,
  };

  if (initialStatus === "internado") {
    episodeData.risk_level = body.risk_level;
  }

  const { data: episode, error: episodeError } = await supabase
    .from("patient_episodes")
    .insert(episodeData)
    .select("*, patient:patients (*)")
    .single();

  if (episodeError) {
    return NextResponse.json({ error: episodeError.message }, { status: 500 });
  }

  const reportParts = [
    `Paciente cadastrado em ${STATUS_LABELS[initialStatus]}.`,
    body.diagnosis?.trim() ? `Diagnóstico: ${body.diagnosis.trim()}` : null,
    body.initial_assessment?.trim()
      ? `Avaliação T0: ${body.initial_assessment.trim()}`
      : null,
  ].filter(Boolean);

  await supabase.from("patient_movements").insert({
    episode_id: episode.id,
    from_status: null,
    to_status: initialStatus,
    report_text: reportParts.join("\n\n"),
    risk_level: initialStatus === "internado" ? body.risk_level : null,
    created_by: user!.id,
  });

  return NextResponse.json({ patient, episode }, { status: 201 });
}
