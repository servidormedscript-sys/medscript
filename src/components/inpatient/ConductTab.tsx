"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CODE_STATUS_OPTIONS,
  type CodeStatus,
} from "@/lib/inpatient/code-status";
import { downloadHandoffPdf } from "@/lib/inpatient/export-handoff-pdf";
import {
  PADUA_ITEMS,
  paduaHighRisk,
  scorePadua,
  suggestTevProphylaxis,
} from "@/lib/inpatient/general-orders";
import { buildConductSuggestion } from "@/lib/inpatient/suggest-conduct";
import { UNIT_LIMITATION_ITEMS } from "@/lib/inpatient/unit-limitations";
import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import type {
  EpisodeConduct,
  EpisodeGeneralOrders,
  EpisodeHandoffTask,
  EpisodeLabValue,
  EpisodePrescription,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";
import { parseWeightKg } from "@/lib/inpatient/parse-weight";

type Props = {
  episodeId: string;
  episode: PatientEpisode;
  patient: Patient;
  conduct: EpisodeConduct;
  tasks: EpisodeHandoffTask[];
  prescriptions: EpisodePrescription[];
  labValues: EpisodeLabValue[];
  generalOrders: EpisodeGeneralOrders;
  clinicalStatus: ClinicalStatusResult;
  onConductChange: (c: EpisodeConduct) => void;
  onTasksChange: (t: EpisodeHandoffTask[]) => void;
  onGeneralOrdersChange: (o: EpisodeGeneralOrders) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function ConductTab({
  episodeId,
  episode,
  patient,
  conduct,
  tasks,
  prescriptions,
  labValues,
  generalOrders,
  clinicalStatus,
  onConductChange,
  onTasksChange,
  onGeneralOrdersChange,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [handoffText, setHandoffText] = useState<string | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const weightKg = parseWeightKg(episode.weight);

  const paduaTotal = useMemo(
    () => scorePadua(generalOrders.padua_score),
    [generalOrders.padua_score],
  );

  const tevHint = useMemo(
    () =>
      suggestTevProphylaxis({
        padua: generalOrders.padua_score,
        ageYears: age?.years ?? null,
        weightKg,
      }),
    [generalOrders.padua_score, age?.years, weightKg],
  );

  const saveConduct = useCallback(
    async (patch: Partial<EpisodeConduct> & { code_status?: CodeStatus }) => {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`/api/pacientes/episodios/${episodeId}/conduta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setMessage(data.error ?? "Erro ao salvar.");
        return;
      }
      onConductChange(data.conduct);
    },
    [episodeId, onConductChange],
  );

  async function addTask() {
    const text = taskDraft.trim();
    if (!text) return;
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/conduta/tarefas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Erro ao adicionar pendência.");
      return;
    }
    setTaskDraft("");
    onTasksChange([data.task, ...tasks]);
  }

  async function toggleTask(task: EpisodeHandoffTask) {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/conduta/tarefas/${task.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      },
    );
    const data = await res.json();
    if (!res.ok) return;
    onTasksChange(
      tasks.map((t) => (t.id === task.id ? data.task : t)),
    );
  }

  async function removeTask(taskId: string) {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/conduta/tarefas/${taskId}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  }

  async function updatePadua(itemId: string, checked: boolean) {
    const padua_score = {
      ...generalOrders.padua_score,
      [itemId]: checked,
    };
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/ordens-gerais`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ padua_score }),
      },
    );
    const data = await res.json();
    if (res.ok) onGeneralOrdersChange(data.generalOrders);
  }

  function suggestConduct() {
    const suggestion = buildConductSuggestion({
      activePrescriptions: prescriptions,
      labValues,
      clinicalStatus,
      padua: generalOrders.padua_score,
      ageYears: age?.years ?? null,
      weightKg,
    });
    const merged = conduct.conduct_text.trim()
      ? `${conduct.conduct_text.trim()}\n\n---\n\n${suggestion}`
      : suggestion;
    onConductChange({ ...conduct, conduct_text: merged });
    saveConduct({ conduct_text: merged });
  }

  async function loadHandoff() {
    setHandoffLoading(true);
    const res = await fetch("/api/pacientes/passagem-plantao");
    const data = await res.json();
    setHandoffLoading(false);
    if (res.ok) setHandoffText(data.text ?? "");
  }

  function copyHandoff() {
    if (!handoffText) return;
    void navigator.clipboard.writeText(handoffText);
    setMessage("Texto copiado.");
  }

  function whatsappHandoff() {
    if (!handoffText) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(handoffText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-md border border-navy-900/10 bg-navy-50 px-3 py-2 text-sm text-navy-900">
          {message}
        </p>
      )}

      <section className="rounded-lg border border-navy-900/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy-950">Status de código</h2>
        <p className="mt-1 text-xs text-navy-800/55">
          Selo visível na ficha e no Kanban quando diferente de reanimação plena.
        </p>
        <div className="mt-4 space-y-2">
          {CODE_STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-navy-900/8 px-3 py-2 hover:bg-navy-50/50"
            >
              <input
                type="radio"
                name="code_status"
                checked={conduct.code_status === opt.value}
                onChange={() =>
                  saveConduct({
                    code_status: opt.value,
                    code_justification: conduct.code_justification,
                  })
                }
                className="mt-1"
              />
              <span className="text-sm text-navy-950">
                {opt.emoji} {opt.label}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-navy-800/60">
            Justificativa (opcional)
          </label>
          <textarea
            rows={2}
            value={conduct.code_justification ?? ""}
            onChange={(e) =>
              onConductChange({
                ...conduct,
                code_justification: e.target.value,
              })
            }
            onBlur={() =>
              saveConduct({
                code_justification: conduct.code_justification,
              })
            }
            className={inputClass}
          />
        </div>
        {conduct.code_updated_at && (
          <p className="mt-2 text-xs text-navy-800/50">
            Atualizado em{" "}
            {new Date(conduct.code_updated_at).toLocaleString("pt-BR")}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy-950">
          Passagem de plantão (I-PASS)
        </h2>
        <p className="mt-1 text-xs text-navy-800/55">
          Pendências deste paciente e plano se piorar.
        </p>

        <label className="mt-4 mb-1 block text-xs font-medium text-navy-800/70">
          Se piorar…
        </label>
        <textarea
          rows={3}
          value={conduct.contingency_plan}
          onChange={(e) =>
            onConductChange({ ...conduct, contingency_plan: e.target.value })
          }
          onBlur={() =>
            saveConduct({ contingency_plan: conduct.contingency_plan })
          }
          className={inputClass}
          placeholder="Ex.: Acionar equipe médica, repetir gasometria, aumentar O₂..."
        />

        <div className="mt-4 flex gap-2">
          <input
            value={taskDraft}
            onChange={(e) => setTaskDraft(e.target.value)}
            placeholder="Nova pendência..."
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
          />
          <button
            type="button"
            onClick={addTask}
            className="shrink-0 rounded-md bg-navy-900 px-3 text-sm font-medium text-white hover:bg-navy-800"
          >
            Adicionar
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-2 rounded-md border border-navy-900/8 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                className="mt-0.5"
              />
              <span
                className={`flex-1 ${task.completed ? "text-navy-800/45 line-through" : "text-navy-950"}`}
              >
                {task.text}
              </span>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="text-xs text-red-700 hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-navy-800/50">Nenhuma pendência registrada.</p>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy-950">Conduta atual</h2>
          <button
            type="button"
            onClick={suggestConduct}
            disabled={saving}
            className="rounded-md border border-navy-900/12 bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-navy-100"
          >
            💡 Sugerir conduta
          </button>
        </div>
        <textarea
          rows={10}
          value={conduct.conduct_text}
          onChange={(e) =>
            onConductChange({ ...conduct, conduct_text: e.target.value })
          }
          onBlur={() => saveConduct({ conduct_text: conduct.conduct_text })}
          className={`${inputClass} mt-3 font-mono text-xs leading-relaxed`}
        />
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy-950">
          Risco de TEV (Padua)
        </h2>
        <p className="mt-1 text-xs text-navy-800/55">
          Sincronizado com a aba Prescrição. Escore:{" "}
          <strong>{paduaTotal}</strong> —{" "}
          {paduaHighRisk(generalOrders.padua_score) ? "alto risco" : "baixo risco"}
        </p>
        {tevHint && (
          <p className="mt-2 text-xs text-navy-800/70">{tevHint}</p>
        )}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PADUA_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-xs text-navy-900">
                <input
                  type="checkbox"
                  checked={Boolean(generalOrders.padua_score[item.id])}
                  onChange={(e) => updatePadua(item.id, e.target.checked)}
                />
                <span>
                  {item.label}{" "}
                  <span className="text-navy-800/45">(+{item.points})</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h2 className="text-sm font-semibold text-navy-950">Regulação</h2>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={conduct.no_specific_treatment}
            onChange={(e) => {
              onConductChange({
                ...conduct,
                no_specific_treatment: e.target.checked,
              });
              saveConduct({ no_specific_treatment: e.target.checked });
            }}
          />
          <span>
            Sem tratamento medicamentoso específico no momento (confirmação
            explícita para regulação/CORE)
          </span>
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-xs text-navy-800/60">
            Especialidade / recurso necessário
          </span>
          <input
            className={`${inputClass} mt-1`}
            value={conduct.resource_needed}
            onChange={(e) =>
              onConductChange({ ...conduct, resource_needed: e.target.value })
            }
            onBlur={() => saveConduct({ resource_needed: conduct.resource_needed })}
          />
        </label>
        <p className="mt-3 text-xs font-medium text-navy-800/60">
          Limitações da unidade
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {UNIT_LIMITATION_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(conduct.unit_limitations[item.id])}
                  onChange={(e) => {
                    const unit_limitations = {
                      ...conduct.unit_limitations,
                      [item.id]: e.target.checked,
                    };
                    onConductChange({ ...conduct, unit_limitations });
                    saveConduct({ unit_limitations });
                  }}
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
        <input
          className={`${inputClass} mt-2`}
          placeholder="Outro"
          value={conduct.unit_limitation_other}
          onChange={(e) =>
            onConductChange({
              ...conduct,
              unit_limitation_other: e.target.value,
            })
          }
          onBlur={() =>
            saveConduct({ unit_limitation_other: conduct.unit_limitation_other })
          }
        />
        <label className="mt-3 block text-sm">
          <span className="text-xs text-navy-800/60">Status CORE</span>
          <select
            className={`${inputClass} mt-1`}
            value={conduct.core_status}
            onChange={(e) => {
              const core_status = e.target.value as EpisodeConduct["core_status"];
              onConductChange({ ...conduct, core_status });
              saveConduct({ core_status });
            }}
          >
            <option value="nenhum">Nenhum</option>
            <option value="aguardando">Aguardando</option>
            <option value="autorizado">Autorizado</option>
            <option value="negado">Negado</option>
          </select>
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={conduct.vaga_judicializada}
            onChange={(e) => {
              onConductChange({
                ...conduct,
                vaga_judicializada: e.target.checked,
              });
              saveConduct({ vaga_judicializada: e.target.checked });
            }}
          />
          Vaga judicializada
        </label>
        {conduct.vaga_judicializada && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              className={inputClass}
              value={conduct.judicial_started_at ?? ""}
              onChange={(e) => {
                onConductChange({
                  ...conduct,
                  judicial_started_at: e.target.value || null,
                });
                saveConduct({
                  judicial_started_at: e.target.value || null,
                });
              }}
            />
            <input
              className={inputClass}
              placeholder="Nº processo"
              value={conduct.judicial_process}
              onChange={(e) =>
                onConductChange({
                  ...conduct,
                  judicial_process: e.target.value,
                })
              }
              onBlur={() =>
                saveConduct({ judicial_process: conduct.judicial_process })
              }
            />
          </div>
        )}
        <p className="mt-4 text-xs font-medium text-navy-800/60">
          Classificação médica da necessidade de transferência
        </p>
        <select
          className={`${inputClass} mt-1`}
          value={conduct.transfer_class}
          onChange={(e) => {
            const transfer_class = e.target
              .value as EpisodeConduct["transfer_class"];
            onConductChange({ ...conduct, transfer_class });
            saveConduct({ transfer_class });
          }}
        >
          <option value="sem">Sem classificação adicional</option>
          <option value="prioritaria">Prioritária</option>
          <option value="urgente">Urgente</option>
          <option value="emergencial">Emergencial</option>
        </select>
        <textarea
          rows={2}
          className={`${inputClass} mt-2`}
          placeholder="Justificativa médica"
          value={conduct.transfer_class_justification}
          onChange={(e) =>
            onConductChange({
              ...conduct,
              transfer_class_justification: e.target.value,
            })
          }
          onBlur={() =>
            saveConduct({
              transfer_class_justification:
                conduct.transfer_class_justification,
            })
          }
        />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={conduct.transfer_class_confirmed}
            onChange={(e) => {
              onConductChange({
                ...conduct,
                transfer_class_confirmed: e.target.checked,
              });
              saveConduct({
                transfer_class_confirmed: e.target.checked,
              });
            }}
          />
          Confirmo esta classificação com base no quadro clínico atual
        </label>
      </section>

      <section className="rounded-lg border border-dashed border-navy-900/15 bg-navy-50/30 p-5">
        <h2 className="text-sm font-semibold text-navy-950">
          Passagem de plantão — todos os internados
        </h2>
        <p className="mt-1 text-xs text-navy-800/55">
          Texto I-PASS agregado por setor (unidade do leito cadastrado).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadHandoff}
            disabled={handoffLoading}
            className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {handoffLoading ? "Gerando..." : "Gerar texto"}
          </button>
          {handoffText && (
            <>
              <button
                type="button"
                onClick={copyHandoff}
                className="rounded-md border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-800"
              >
                Copiar
              </button>
              <button
                type="button"
                onClick={() => downloadHandoffPdf(handoffText)}
                className="rounded-md border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-800"
              >
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={whatsappHandoff}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900"
              >
                WhatsApp
              </button>
            </>
          )}
        </div>
        {handoffText && (
          <pre className="mt-4 max-h-80 overflow-auto rounded-md border border-navy-900/10 bg-white p-3 text-xs whitespace-pre-wrap text-navy-900">
            {handoffText}
          </pre>
        )}
      </section>
    </div>
  );
}
