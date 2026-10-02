import type { SupabaseClient } from "@supabase/supabase-js";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { PHYSICAL_EXAM_NORMAL_TEXT } from "@/lib/inpatient/physical-exam-defaults";
import type { ProtocolInternationTransfer } from "@/lib/inpatient/protocol-internation";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";
import { SEX_LABELS } from "@/lib/types/patient";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function p(text: string): string {
  return `<p>${esc(text)}</p>`;
}

export async function chartNeedsAdmissionSeed(
  supabase: SupabaseClient,
  episodeId: string,
): Promise<boolean> {
  const [vitals, evolutions] = await Promise.all([
    supabase
      .from("episode_vital_records")
      .select("id", { count: "exact", head: true })
      .eq("episode_id", episodeId),
    supabase
      .from("episode_evolutions")
      .select("id", { count: "exact", head: true })
      .eq("episode_id", episodeId),
  ]);
  return (vitals.count ?? 0) === 0 && (evolutions.count ?? 0) === 0;
}

/** Primeira internação via kanban (sem protocolo/T0): evolução inicial a partir do relatório. */
export async function seedAdmissionFromKanbanReport(
  supabase: SupabaseClient,
  episode: PatientEpisode,
  patient: Patient,
  reportText: string,
  userId: string | null,
): Promise<void> {
  const note = reportText.trim();
  if (!note) return;
  await seedAdmissionFromProtocolTransfer(
    supabase,
    episode,
    patient,
    {
      protocolId: "kanban-internacao",
      protocolName: "Internação (kanban)",
      suggestedDiagnosis: episode.diagnosis?.trim() ?? "",
      vitals: null,
      freeNote: note,
      events: [],
    },
    userId,
  );
}

export async function seedAdmissionFromProtocolTransfer(
  supabase: SupabaseClient,
  episode: PatientEpisode,
  patient: Patient,
  transfer: Omit<ProtocolInternationTransfer, "createdAt">,
  userId: string | null,
): Promise<void> {
  const sourceLabel =
    transfer.admissionSource === "grave_t0"
      ? "Meu Paciente Grave (T0)"
      : `protocolo ${transfer.protocolName}`;

  const v = transfer.vitals;
  const hasVital =
    v &&
    (v.pas != null ||
      v.pad != null ||
      v.fc != null ||
      v.fr != null ||
      v.spo2 != null ||
      v.temperature != null ||
      v.glasgow != null);

  if (hasVital && v) {
    const recordedAt = new Date().toISOString();
    const { data: vitalRow } = await supabase
      .from("episode_vital_records")
      .insert({
        episode_id: episode.id,
        recorded_at: recordedAt,
        pas: v.pas ?? null,
        pad: v.pad ?? null,
        fc: v.fc ?? null,
        fr: v.fr ?? null,
        spo2: v.spo2 ?? null,
        temperature: v.temperature ?? null,
        glasgow: v.glasgow ?? null,
        observation: "Trazido da triagem no momento da internação.",
        created_by: userId,
      })
      .select("id")
      .single();
    await appendTimelineEvent(supabase, {
      episode_id: episode.id,
      event_type: "admissao_protocolo",
      summary_text: `Admissão via ${sourceLabel}`,
      occurred_at: recordedAt,
    });
    if (vitalRow?.id) {
      await appendTimelineEvent(supabase, {
        episode_id: episode.id,
        event_type: "vitais",
        summary_text: "Vitais importados do protocolo clínico",
        occurred_at: recordedAt,
        source_id: String(vitalRow.id),
      });
    }
  } else {
    await appendTimelineEvent(supabase, {
      episode_id: episode.id,
      event_type: "admissao_protocolo",
      summary_text: `Admissão via ${sourceLabel}`,
    });
  }

  const examNote = transfer.physicalExamNote?.trim();
  if (examNote) {
    const recordedAt = new Date().toISOString();
    const systems = {
      estado_geral: { altered: true, note: examNote },
      cardiovascular: {
        altered: false,
        note: PHYSICAL_EXAM_NORMAL_TEXT.cardiovascular,
      },
      respiratorio: {
        altered: false,
        note: PHYSICAL_EXAM_NORMAL_TEXT.respiratorio,
      },
      abdome: { altered: false, note: PHYSICAL_EXAM_NORMAL_TEXT.abdome },
      extremidades: {
        altered: false,
        note: PHYSICAL_EXAM_NORMAL_TEXT.extremidades,
      },
      neurologico: {
        altered: false,
        note: PHYSICAL_EXAM_NORMAL_TEXT.neurologico,
      },
      pele_mucosas: {
        altered: false,
        note: PHYSICAL_EXAM_NORMAL_TEXT.pele_mucosas,
      },
    };
    const { data: examRow } = await supabase
      .from("episode_physical_exams")
      .insert({
        episode_id: episode.id,
        recorded_at: recordedAt,
        without_changes: false,
        systems,
        created_by: userId,
      })
      .select("id")
      .single();
    if (examRow?.id) {
      await appendTimelineEvent(supabase, {
        episode_id: episode.id,
        event_type: "exame_fisico",
        summary_text: "Exame físico inicial (T0 / admissão)",
        occurred_at: recordedAt,
        source_id: String(examRow.id),
      });
    }
  }

  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const sexLabel = patient.sex ? SEX_LABELS[patient.sex] : "—";
  const hora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dx = episode.diagnosis?.trim() || transfer.suggestedDiagnosis || "—";
  const peso = episode.weight?.trim() || v?.weight?.trim() || "—";

  const parts: string[] = [];
  parts.push(
    p(
      `Paciente ${sexLabel}, ${age?.years ?? "—"} anos, ${peso}kg, deu entrada às ${hora} com quadro de ${dx}.`,
    ),
  );

  const vitalLine: string[] = [];
  if (v?.glasgow != null) vitalLine.push(`Glasgow ${v.glasgow}`);
  if (v?.spo2 != null) vitalLine.push(`SatO₂ ${v.spo2}%`);
  if (v?.pas != null) vitalLine.push(`PAS ${v.pas} mmHg`);
  if (v?.fc != null) vitalLine.push(`FC ${v.fc} bpm`);
  if (v?.fr != null) vitalLine.push(`FR ${v.fr} irpm`);
  if (v?.temperature != null) vitalLine.push(`Tax ${v.temperature} °C`);
  if (vitalLine.length) {
    parts.push(p(`Sinais vitais à admissão: ${vitalLine.join(", ")}.`));
  }

  if (transfer.events.length > 0) {
    const lines = transfer.events
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((e) => `${e.at} — ${e.text}`);
    parts.push(p(`Condutas/medicações realizadas: ${lines.join("; ")}.`));
  } else if (transfer.freeNote.trim()) {
    parts.push(p(transfer.freeNote.trim()));
  }

  const leito = episode.bed?.trim() || "—";
  parts.push(
    p(
      `Paciente internado(a) no leito ${leito} para observação e conduta conforme protocolo.`,
    ),
  );

  const signedAt = new Date().toISOString();
  const { data: evoRow } = await supabase
    .from("episode_evolutions")
    .insert({
      episode_id: episode.id,
      content_html: parts.join(""),
      created_by: userId,
      signed_at: signedAt,
      signed_by: userId,
    })
    .select("id, created_at")
    .single();

  if (evoRow?.id) {
    await appendTimelineEvent(supabase, {
      episode_id: episode.id,
      event_type: "evolucao",
      summary_text: "Evolução inicial assinada (protocolo)",
      occurred_at: signedAt,
      source_id: String(evoRow.id),
    });
  }
}
