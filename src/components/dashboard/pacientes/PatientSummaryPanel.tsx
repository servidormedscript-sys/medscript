"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivePatientEpisode } from "@/lib/types/clinical-assessment";
import {
  DOSE_INTERVAL_OPTIONS,
  formatMedicationDateTime,
  formatMedicationTime,
  getMedicationScheduleInfo,
  getMedicationStatusLabel,
  getTodayTakenDoses,
  isDoseTakenAtSlot,
} from "@/lib/medication-schedule";
import {
  EXAM_STATUS_LABELS,
  todayDateString,
  type PatientCareItem,
  type PatientExamStatus,
} from "@/lib/types/patient-care";
import { STATUS_LABELS } from "@/lib/types/patient";
import { formatCpf } from "@/lib/utils/cpf";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

type PatientSummaryPanelProps = {
  initialEpisodeId?: string;
};

export default function PatientSummaryPanel({
  initialEpisodeId,
}: PatientSummaryPanelProps) {
  const [patients, setPatients] = useState<ActivePatientEpisode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [items, setItems] = useState<PatientCareItem[]>([]);
  const [today, setToday] = useState(todayDateString());
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [examTitle, setExamTitle] = useState("");
  const [examNotes, setExamNotes] = useState("");
  const [examScheduledFor, setExamScheduledFor] = useState("");

  const [medTitle, setMedTitle] = useState("");
  const [medNotes, setMedNotes] = useState("");
  const [medIntervalHours, setMedIntervalHours] = useState("4");
  const [registerFirstDoseNow, setRegisterFirstDoseNow] = useState(true);
  const [medFirstDoseNotes, setMedFirstDoseNotes] = useState("");
  const [doseNotesByItem, setDoseNotesByItem] = useState<Record<string, string>>({});
  const [examCompletionNotesByItem, setExamCompletionNotesByItem] = useState<
    Record<string, string>
  >({});

  const selected = patients.find((p) => p.id === selectedEpisodeId);

  const exams = useMemo(
    () => items.filter((item) => item.item_type === "exame"),
    [items]
  );
  const medications = useMemo(
    () => items.filter((item) => item.item_type === "medicamento"),
    [items]
  );
  const pendingExams = exams.filter(
    (item) => (item.exam_status ?? "pendente") === "pendente"
  );
  const completedExams = exams.filter((item) => item.exam_status === "realizado");

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch("/api/pacientes/ativos");
      const data = await res.json();
      if (res.ok) setPatients(data.patients ?? []);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  const loadItems = useCallback(async (episodeId: string) => {
    setLoadingItems(true);
    setError(null);
    const res = await fetch(`/api/pacientes/episodios/${episodeId}/resumo`);
    const data = await res.json();
    setLoadingItems(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar resumo.");
      setItems([]);
      return;
    }

    setItems(data.items ?? []);
    setToday(data.today ?? todayDateString());
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (initialEpisodeId) {
      setSelectedEpisodeId(initialEpisodeId);
    }
  }, [initialEpisodeId]);

  useEffect(() => {
    if (!selectedEpisodeId) {
      setItems([]);
      return;
    }
    loadItems(selectedEpisodeId);
  }, [selectedEpisodeId, loadItems]);

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEpisodeId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/pacientes/episodios/${selectedEpisodeId}/resumo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_type: "exame",
        title: examTitle,
        notes: examNotes,
        scheduled_for: examScheduledFor || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao registrar exame.");
      return;
    }

    setExamTitle("");
    setExamNotes("");
    setExamScheduledFor("");
    setMessage("Exame adicionado como pendente.");
    loadItems(selectedEpisodeId);
  }

  async function createMedication(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEpisodeId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/pacientes/episodios/${selectedEpisodeId}/resumo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_type: "medicamento",
        title: medTitle,
        notes: medNotes,
        dose_interval_hours: Number(medIntervalHours),
        register_dose_now: registerFirstDoseNow,
        dose_notes: registerFirstDoseNow ? medFirstDoseNotes : undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao registrar medicamento.");
      return;
    }

    setMedTitle("");
    setMedNotes("");
    setMedFirstDoseNotes("");
    setMessage("Medicamento adicionado.");
    loadItems(selectedEpisodeId);
  }

  async function registerDoseNow(item: PatientCareItem) {
    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${item.id}/doses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        take_now: true,
        taken: true,
        notes: doseNotesByItem[item.id] ?? "",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao registrar tomada.");
      return;
    }

    setDoseNotesByItem((current) => ({ ...current, [item.id]: "" }));
    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  async function updateMedicationInterval(itemId: string, dose_interval_hours: number) {
    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dose_interval_hours }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar intervalo.");
      return;
    }

    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  async function completeExam(itemId: string) {
    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_status: "realizado",
        completion_notes: examCompletionNotesByItem[itemId] ?? "",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar exame.");
      return;
    }

    setExamCompletionNotesByItem((current) => ({ ...current, [itemId]: "" }));
    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  async function updateExamStatus(itemId: string, exam_status: PatientExamStatus) {
    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam_status }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar exame.");
      return;
    }

    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  async function toggleDose(item: PatientCareItem, scheduleTime: string, taken: boolean) {
    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${item.id}/doses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule_time: scheduleTime,
        dose_date: today,
        taken,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao registrar horário.");
      return;
    }

    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  async function removeItem(itemId: string) {
    if (!window.confirm("Remover esta solicitação?")) return;

    setError(null);
    const res = await fetch(`/api/pacientes/resumo/${itemId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao remover solicitação.");
      return;
    }

    if (selectedEpisodeId) loadItems(selectedEpisodeId);
  }

  function isDoseTaken(item: PatientCareItem, scheduleTime: string) {
    return isDoseTakenAtSlot(item.medication_doses, scheduleTime);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-navy-900/8 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-navy-950">
          Resumo dos Pacientes
        </h2>
        <p className="mb-4 text-sm text-navy-800/65">
          Controle solicitações de exames, pendências e horários de medicação dos
          pacientes ativos.
        </p>

        {loadingPatients ? (
          <p className="text-sm text-navy-800/60">Carregando pacientes...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-navy-800/60">
            Nenhum paciente ativo no Kanban.
          </p>
        ) : (
          <select
            value={selectedEpisodeId}
            onChange={(e) => {
              setSelectedEpisodeId(e.target.value);
              setMessage(null);
              setError(null);
            }}
            className={`${inputClass} md:max-w-xl`}
          >
            <option value="">Selecione o paciente</option>
            {patients.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {episode.patient.full_name} — CPF {formatCpf(episode.patient.cpf)} —{" "}
                {STATUS_LABELS[episode.status as keyof typeof STATUS_LABELS] ??
                  episode.status}
              </option>
            ))}
          </select>
        )}

        {selected && (
          <p className="mt-3 text-sm text-navy-800/65">
            Ficha #{selected.episode_number} ·{" "}
            {STATUS_LABELS[selected.status as keyof typeof STATUS_LABELS] ??
              selected.status}
          </p>
        )}
      </section>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {selectedEpisodeId && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-navy-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-800/50">
                Exames pendentes
              </p>
              <p className="mt-1 text-2xl font-medium text-navy-950">
                {pendingExams.length}
              </p>
            </div>
            <div className="rounded-lg border border-navy-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-800/50">
                Exames realizados
              </p>
              <p className="mt-1 text-2xl font-medium text-navy-950">
                {completedExams.length}
              </p>
            </div>
            <div className="rounded-lg border border-navy-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-navy-800/50">
                Medicamentos ativos
              </p>
              <p className="mt-1 text-2xl font-medium text-navy-950">
                {medications.length}
              </p>
            </div>
          </div>

          {loadingItems ? (
            <p className="text-sm text-navy-800/60">Carregando resumo...</p>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-navy-900/8 bg-white p-6">
                <h3 className="mb-4 text-sm font-medium text-navy-950">Exames</h3>

                <form onSubmit={createExam} className="mb-6 space-y-3 border-b border-navy-900/8 pb-6">
                  <input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Nome do exame"
                    className={inputClass}
                    required
                  />
                  <input
                    type="datetime-local"
                    value={examScheduledFor}
                    onChange={(e) => setExamScheduledFor(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={examNotes}
                    onChange={(e) => setExamNotes(e.target.value)}
                    placeholder="Observações da solicitação (opcional)"
                    rows={2}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                  >
                    Adicionar exame
                  </button>
                </form>

                {exams.length === 0 ? (
                  <p className="text-sm text-navy-800/60">Nenhum exame registrado.</p>
                ) : (
                  <ul className="space-y-3">
                    {exams.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md border border-navy-900/8 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-navy-950">{item.title}</p>
                            <p className="mt-1 text-xs text-navy-800/60">
                              {EXAM_STATUS_LABELS[item.exam_status ?? "pendente"]}
                              {item.scheduled_for &&
                                ` · Agendado para ${new Date(item.scheduled_for).toLocaleString("pt-BR")}`}
                              {item.completed_at &&
                                item.exam_status === "realizado" &&
                                ` · Realizado em ${new Date(item.completed_at).toLocaleString("pt-BR")}`}
                            </p>
                            {item.notes && (
                              <p className="mt-2 text-xs text-navy-800/70">
                                <span className="font-medium">Obs. solicitação:</span>{" "}
                                {item.notes}
                              </p>
                            )}
                            {item.completion_notes && (
                              <p className="mt-2 text-xs text-navy-800/70">
                                <span className="font-medium">Obs. resultado:</span>{" "}
                                {item.completion_notes}
                              </p>
                            )}
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:w-auto">
                            {item.exam_status === "pendente" && (
                              <>
                                <textarea
                                  value={examCompletionNotesByItem[item.id] ?? ""}
                                  onChange={(e) =>
                                    setExamCompletionNotesByItem((current) => ({
                                      ...current,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Observações do resultado (opcional)"
                                  rows={2}
                                  className={`${inputClass} min-w-[220px] text-xs`}
                                />
                                <button
                                  type="button"
                                  onClick={() => completeExam(item.id)}
                                  className="rounded-md bg-navy-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-navy-800"
                                >
                                  Marcar realizado
                                </button>
                              </>
                            )}
                            {item.exam_status !== "pendente" && (
                              <button
                                type="button"
                                onClick={() => updateExamStatus(item.id, "pendente")}
                                className="rounded-md border border-navy-900/12 px-2.5 py-1 text-[11px] font-medium text-navy-800 hover:bg-navy-50"
                              >
                                Voltar pendente
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-lg border border-navy-900/8 bg-white p-6">
                <h3 className="mb-1 text-sm font-medium text-navy-950">
                  Medicamentos
                </h3>
                <p className="mb-4 text-xs text-navy-800/55">
                  Registre a tomada atual e o sistema calcula a próxima dose
                  automaticamente.
                </p>

                <form
                  onSubmit={createMedication}
                  className="mb-6 space-y-3 border-b border-navy-900/8 pb-6"
                >
                  <input
                    value={medTitle}
                    onChange={(e) => setMedTitle(e.target.value)}
                    placeholder="Nome do medicamento"
                    className={inputClass}
                    required
                  />
                  <select
                    value={medIntervalHours}
                    onChange={(e) => setMedIntervalHours(e.target.value)}
                    className={inputClass}
                    required
                  >
                    {DOSE_INTERVAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-navy-800/75">
                    <input
                      type="checkbox"
                      checked={registerFirstDoseNow}
                      onChange={(e) => setRegisterFirstDoseNow(e.target.checked)}
                      className="h-4 w-4 rounded border-navy-900/20"
                    />
                    Registrar primeira tomada agora
                  </label>
                  {registerFirstDoseNow && (
                    <textarea
                      value={medFirstDoseNotes}
                      onChange={(e) => setMedFirstDoseNotes(e.target.value)}
                      placeholder="Observações da primeira tomada (opcional)"
                      rows={2}
                      className={inputClass}
                    />
                  )}
                  <textarea
                    value={medNotes}
                    onChange={(e) => setMedNotes(e.target.value)}
                    placeholder="Observações gerais do medicamento (opcional)"
                    rows={2}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                  >
                    Adicionar medicamento
                  </button>
                </form>

                {medications.length === 0 ? (
                  <p className="text-sm text-navy-800/60">
                    Nenhum medicamento registrado.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {medications.map((item) => {
                      const schedule = getMedicationScheduleInfo(item);
                      const todayDoses = getTodayTakenDoses(item.medication_doses, today);
                      const usesInterval = Boolean(item.dose_interval_hours);

                      return (
                      <li
                        key={item.id}
                        className="rounded-md border border-navy-900/8 p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-navy-950">{item.title}</p>
                            {usesInterval ? (
                              <p className="mt-1 text-xs text-navy-800/60">
                                {schedule.intervalLabel}
                                {schedule.lastTakenAt &&
                                  ` · Última tomada: ${formatMedicationDateTime(schedule.lastTakenAt)}`}
                                {schedule.nextDueAt &&
                                  ` · Próxima: ${formatMedicationDateTime(schedule.nextDueAt)}`}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-navy-800/60">
                                Horários fixos (legado)
                              </p>
                            )}
                            {usesInterval && (
                              <p
                                className={`mt-1 text-xs font-medium ${
                                  schedule.isOverdue
                                    ? "text-red-800"
                                    : schedule.lastTakenAt
                                      ? "text-green-800"
                                      : "text-navy-800/60"
                                }`}
                              >
                                {getMedicationStatusLabel(schedule)}
                              </p>
                            )}
                            {item.notes && (
                              <p className="mt-2 text-xs text-navy-800/70">
                                <span className="font-medium">Obs. geral:</span> {item.notes}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </button>
                        </div>

                        {usesInterval ? (
                          <div className="space-y-3">
                            <textarea
                              value={doseNotesByItem[item.id] ?? ""}
                              onChange={(e) =>
                                setDoseNotesByItem((current) => ({
                                  ...current,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Observações desta tomada (opcional)"
                              rows={2}
                              className={inputClass}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => registerDoseNow(item)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                                  schedule.isOverdue
                                    ? "bg-red-700 hover:bg-red-600"
                                    : "bg-navy-900 hover:bg-navy-800"
                                }`}
                              >
                                Tomou agora ({formatMedicationTime(new Date())})
                              </button>
                              <select
                                value={item.dose_interval_hours ?? 4}
                                onChange={(e) =>
                                  updateMedicationInterval(
                                    item.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="rounded-md border border-navy-900/12 bg-white px-2 py-1.5 text-xs text-navy-950"
                              >
                                {DOSE_INTERVAL_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {todayDoses.length > 0 && (
                              <div>
                                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-navy-800/50">
                                  Registro de tomadas hoje
                                </p>
                                <ul className="space-y-1 text-xs text-navy-800/75">
                                  {todayDoses.map((dose) => (
                                    <li key={dose.id}>
                                      • {formatMedicationTime(new Date(dose.taken_at!))}
                                      {dose.notes ? ` — ${dose.notes}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                        <div className="space-y-2">
                          {(item.schedule_times ?? []).map((scheduleTime) => {
                            const taken = isDoseTaken(item, scheduleTime);
                            return (
                              <label
                                key={scheduleTime}
                                className="flex cursor-pointer items-center justify-between rounded border border-navy-900/8 bg-navy-50/40 px-3 py-2 text-sm"
                              >
                                <span className="text-navy-900">{scheduleTime}</span>
                                <span className="flex items-center gap-2 text-xs text-navy-800/70">
                                  {taken ? "Tomado" : "Pendente"}
                                  <input
                                    type="checkbox"
                                    checked={taken}
                                    onChange={(e) =>
                                      toggleDose(item, scheduleTime, e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-navy-900/20"
                                  />
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        )}
                      </li>
                    );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
