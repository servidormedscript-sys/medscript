"use client";

import { useMemo, useState } from "react";
import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import type { LabAlert } from "@/lib/inpatient/lab-alerts";
import type { CriticalLabConduct } from "@/lib/inpatient/lab-critical-conduct";
import { COMORBIDITY_ITEMS } from "@/lib/inpatient/comorbidities";
import {
  buildResumoAlertGroups,
  resumoHasActiveAlerts,
} from "@/lib/inpatient/resumo-dashboard";
import { stripHtmlToPlain } from "@/lib/inpatient/handoff-text";
import { formatPhysicalExamBlock } from "@/lib/inpatient/physical-exam-defaults";
import {
  pickUltimoVital,
  summarizeVitals,
} from "@/lib/inpatient/vital-devices";
import type {
  EpisodeComorbidities,
  EpisodeEvolution,
  EpisodePhysicalExam,
  EpisodeProblem,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import type { InpatientChartTabId } from "@/lib/inpatient/chart-tabs";
import { computeDischargePrediction } from "@/lib/inpatient/discharge-prediction";
import { buildPatientNextSteps } from "@/lib/inpatient/patient-next-steps";
import type { CodeStatus } from "@/lib/types/inpatient-chart";
import type {
  EpisodeLabPending,
  EpisodeLabValue,
} from "@/lib/types/inpatient-chart";
import type { PatientEpisode } from "@/lib/types/patient";
import ClinicalStatusPanel from "./ClinicalStatusPanel";

type Props = {
  episodeId: string;
  birthDate: string | null;
  clinicalStatus: ClinicalStatusResult;
  vitals: EpisodeVitalRecord[];
  exams: EpisodePhysicalExam[];
  evolutions: EpisodeEvolution[];
  conductText: string | null;
  labAlerts: LabAlert[];
  criticalConducts: CriticalLabConduct[];
  labValues: EpisodeLabValue[];
  pendingLabs: EpisodeLabPending[];
  pendingReconciliation: number;
  codeStatus?: CodeStatus | null;
  episode: PatientEpisode;
  paduaFilled: boolean;
  codeUpdatedAt?: string | null;
  problems: EpisodeProblem[];
  comorbidities: EpisodeComorbidities;
  counts: {
    vitals: number;
    exams: number;
    evolutions: number;
    activeRx: number;
    labAlerts: number;
    imagingReports: number;
  };
  onProblemsChange: (p: EpisodeProblem[]) => void;
  onComorbiditiesChange: (c: EpisodeComorbidities) => void;
  onNavigateTab: (tab: InpatientChartTabId) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function ResumoTab({
  episodeId,
  clinicalStatus,
  vitals,
  exams,
  evolutions,
  birthDate,
  conductText,
  labAlerts,
  criticalConducts,
  labValues,
  pendingLabs,
  pendingReconciliation,
  codeStatus,
  episode,
  paduaFilled,
  codeUpdatedAt,
  problems,
  comorbidities,
  counts,
  onProblemsChange,
  onComorbiditiesChange,
  onNavigateTab,
}: Props) {
  const [newProblem, setNewProblem] = useState("");
  const [savingComorb, setSavingComorb] = useState(false);

  const ultimoVital = pickUltimoVital(vitals);
  const lastExam = exams[0];
  const lastEv =
    evolutions.find((e) => e.signed_at) ?? evolutions[0];

  const alertGroups = useMemo(
    () =>
      buildResumoAlertGroups({
        vitalRecords: vitals,
        birthDate,
        labAlerts,
        criticalConducts,
      }),
    [vitals, birthDate, labAlerts, criticalConducts],
  );
  const hasAlerts = resumoHasActiveAlerts(alertGroups);

  const nextSteps = useMemo(
    () =>
      buildPatientNextSteps({
        clinicalStatus,
        vitalRecords: vitals,
        labAlerts,
        criticalConducts,
        pendingReconciliation,
        pendingLabs,
        codeStatus,
        internationHours:
          (Date.now() - new Date(episode.created_at).getTime()) /
          (1000 * 60 * 60),
        paduaFilled,
        codeReviewDue:
          clinicalStatus.risk === "alto" &&
          (!codeUpdatedAt ||
            (Date.now() - new Date(codeUpdatedAt).getTime()) /
              (1000 * 60 * 60) >
              48),
      }),
    [
      clinicalStatus,
      vitals,
      labAlerts,
      criticalConducts,
      pendingReconciliation,
      pendingLabs,
      codeStatus,
      episode.created_at,
      paduaFilled,
      codeUpdatedAt,
    ],
  );

  const dischargePrediction = useMemo(
    () =>
      computeDischargePrediction({
        clinicalStatus,
        labValues,
        vitalRecords: vitals,
        diagnosis: episode.diagnosis,
        codeStatus,
        activeLabAlertCount: labAlerts.length,
      }),
    [
      clinicalStatus,
      labValues,
      vitals,
      episode.diagnosis,
      codeStatus,
      labAlerts.length,
    ],
  );

  async function addProblem() {
    const text = newProblem.trim();
    if (!text) return;
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/painel-clinico/problemas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
    );
    const data = await res.json();
    if (!res.ok) return;
    setNewProblem("");
    onProblemsChange([data.problem, ...problems]);
  }

  async function toggleProblem(problem: EpisodeProblem) {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/painel-clinico/problemas/${problem.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !problem.active }),
      },
    );
    const data = await res.json();
    if (!res.ok) return;
    onProblemsChange(
      problems.map((p) => (p.id === problem.id ? data.problem : p)),
    );
  }

  async function saveComorbidities(
    flags: Record<string, boolean>,
    otherText: string,
  ) {
    setSavingComorb(true);
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/painel-clinico`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags, other_text: otherText }),
      },
    );
    const data = await res.json();
    setSavingComorb(false);
    if (res.ok) onComorbiditiesChange(data.comorbidities);
  }

  return (
    <div className="space-y-6">
      <ClinicalStatusPanel status={clinicalStatus} />

      <section className="rounded-lg border border-ocean-200 bg-ocean-50/50 p-4">
        <h3 className="text-sm font-semibold text-navy-950">O que fazer agora</h3>
        {nextSteps.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/55">
            Nenhuma pendência prioritária detectada pelas regras do prontuário.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {nextSteps.map((step) => (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-navy-900/8 bg-white px-3 py-2 text-sm"
              >
                <span>
                  {step.priority === "urgent" && "🔴 "}
                  {step.priority === "attention" && "🟡 "}
                  {step.priority === "positive" && "🟢 "}
                  {step.text}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab(step.tab)}
                  className="shrink-0 text-xs font-medium text-navy-800 underline hover:no-underline"
                >
                  Ir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Previsão de alta</h3>
        {dischargePrediction.suppressed ? (
          <p className="mt-2 text-sm text-navy-900">
            {dischargePrediction.suppressedReason}
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm font-medium text-navy-950">
              Previsão: {dischargePrediction.minDays} a{" "}
              {dischargePrediction.maxDays} dias
            </p>
            <ul className="mt-2 space-y-1 text-xs text-navy-800/75">
              {dischargePrediction.factors.map((f) => (
                <li key={f.label}>
                  {f.deltaDays > 0 ? "+" : ""}
                  {f.deltaDays !== 0 ? `${f.deltaDays} d — ` : ""}
                  {f.label}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 text-[11px] text-navy-800/50">
          {dischargePrediction.disclaimer}
        </p>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Alertas clínicos</h3>
        {!hasAlerts && (
          <p className="mt-2 text-sm text-navy-800/55">
            Nenhum alerta de vital, exame ou conduta crítica ativo no momento.
          </p>
        )}
        <ul className="mt-3 space-y-3 text-sm">
          {alertGroups.vitalCritical.length > 0 && (
            <li>
              <p className="text-xs font-medium text-red-800">Vitais críticos</p>
              <ul className="mt-1 space-y-0.5 text-red-900">
                {alertGroups.vitalCritical.map((a) => (
                  <li key={`vc-${a.field}`}>• {a.message}</li>
                ))}
              </ul>
            </li>
          )}
          {alertGroups.vitalRange.length > 0 && (
            <li>
              <p className="text-xs font-medium text-amber-900">
                Vitais fora da faixa
              </p>
              <ul className="mt-1 space-y-0.5 text-amber-950">
                {alertGroups.vitalRange.map((a) => (
                  <li key={`vr-${a.field}`}>• {a.message}</li>
                ))}
              </ul>
            </li>
          )}
          {alertGroups.labRange.length > 0 && (
            <li>
              <p className="text-xs font-medium text-amber-900">
                Exames fora da faixa
              </p>
              <ul className="mt-1 space-y-0.5 text-amber-950">
                {alertGroups.labRange.map((a) => (
                  <li key={`lr-${a.analyteKey}`}>• {a.message}</li>
                ))}
              </ul>
            </li>
          )}
          {alertGroups.labTrend.length > 0 && (
            <li>
              <p className="text-xs font-medium text-amber-900">
                Tendência de exames
              </p>
              <ul className="mt-1 space-y-0.5 text-amber-950">
                {alertGroups.labTrend.map((a) => (
                  <li key={`lt-${a.analyteKey}`}>• {a.message}</li>
                ))}
              </ul>
            </li>
          )}
          {alertGroups.criticalConducts.length > 0 && (
            <li>
              <p className="text-xs font-medium text-red-800">
                Condutas críticas sugeridas (exames)
              </p>
              <ul className="mt-1 space-y-2 text-navy-900">
                {alertGroups.criticalConducts.map((c) => (
                  <li key={c.id} className="rounded border border-red-100 bg-red-50/40 px-2 py-1.5">
                    <span className="font-medium">{c.title}</span>
                    <p className="mt-0.5 text-xs text-navy-800/80">{c.detail}</p>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
        {hasAlerts && (
          <button
            type="button"
            onClick={() => onNavigateTab("exames")}
            className="mt-3 text-xs font-medium text-navy-800 underline hover:no-underline"
          >
            Abrir aba Exames
          </button>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Últimos registros</h3>
        <dl className="mt-3 space-y-2 text-sm text-navy-900">
          <div>
            <dt className="text-navy-800/55">Sinais vitais</dt>
            <dd>
              {ultimoVital
                ? summarizeVitals(ultimoVital)
                : "Nenhum registro numérico."}
            </dd>
          </div>
          <div>
            <dt className="text-navy-800/55">Exame físico</dt>
            <dd className="whitespace-pre-wrap text-xs">
              {lastExam
                ? formatPhysicalExamBlock(lastExam.systems).slice(0, 400)
                : "Não registrado."}
            </dd>
          </div>
          <div>
            <dt className="text-navy-800/55">Evolução</dt>
            <dd className="line-clamp-4 text-xs">
              {lastEv
                ? stripHtmlToPlain(lastEv.content_html).slice(0, 500)
                : "Não registrada."}
            </dd>
          </div>
          <div>
            <dt className="text-navy-800/55">Conduta atual</dt>
            <dd className="line-clamp-3 text-xs whitespace-pre-wrap">
              {conductText?.trim() || "Não registrada na aba Conduta."}
            </dd>
          </div>
          {counts.labAlerts > 0 && (
            <p className="text-amber-900 text-xs">
              {counts.labAlerts} alerta(s) de exame ativo(s) — ver bloco Alertas
              clínicos acima.
            </p>
          )}
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["vitais", "evolucao", "exames", "conduta"] as InpatientChartTabId[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onNavigateTab(tab)}
                className="rounded border border-navy-900/12 px-2 py-1 text-xs font-medium text-navy-800 hover:bg-navy-50"
              >
                Abrir {tab}
              </button>
            ),
          )}
        </div>
      </section>

      <dl className="grid gap-3 rounded-lg border border-navy-900/8 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <dt className="text-navy-800/55">Vitais</dt>
          <dd className="font-medium text-navy-950">{counts.vitals}</dd>
        </div>
        <div>
          <dt className="text-navy-800/55">Exames físicos</dt>
          <dd className="font-medium text-navy-950">{counts.exams}</dd>
        </div>
        <div>
          <dt className="text-navy-800/55">Evoluções</dt>
          <dd className="font-medium text-navy-950">{counts.evolutions}</dd>
        </div>
        <div>
          <dt className="text-navy-800/55">Prescrições ativas</dt>
          <dd className="font-medium text-navy-950">{counts.activeRx}</dd>
        </div>
        <div>
          <dt className="text-navy-800/55">Alertas de exame</dt>
          <dd className="font-medium text-navy-950">{counts.labAlerts}</dd>
        </div>
        <div>
          <dt className="text-navy-800/55">Laudos de imagem</dt>
          <dd className="font-medium text-navy-950">{counts.imagingReports}</dd>
        </div>
      </dl>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Lista de problemas</h3>
        <p className="mt-1 text-xs text-navy-800/55">
          O diagnóstico de admissão entra automaticamente na primeira abertura do
          resumo.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={newProblem}
            onChange={(e) => setNewProblem(e.target.value)}
            placeholder="Novo problema ativo..."
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProblem();
              }
            }}
          />
          <button
            type="button"
            onClick={addProblem}
            className="shrink-0 rounded-md bg-navy-900 px-3 text-sm font-medium text-white"
          >
            Adicionar
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {problems.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-navy-900/8 px-3 py-2 text-sm"
            >
              <span className={p.active ? "text-navy-950" : "text-navy-800/45 line-through"}>
                {p.text}
                {!p.active && p.resolved_at && (
                  <span className="ml-2 text-xs text-navy-800/45">
                    resolvido {new Date(p.resolved_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => toggleProblem(p)}
                className="text-xs font-medium text-navy-800 hover:underline"
              >
                {p.active ? "Marcar resolvido" : "Reabrir"}
              </button>
            </li>
          ))}
          {problems.length === 0 && (
            <p className="text-sm text-navy-800/50">Nenhum problema listado.</p>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Comorbidades</h3>
        {savingComorb && (
          <p className="mt-1 text-xs text-navy-800/50">Salvando...</p>
        )}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COMORBIDITY_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-2 text-sm text-navy-900">
                <input
                  type="checkbox"
                  checked={Boolean(comorbidities.flags[item.id])}
                  onChange={(e) => {
                    const flags = {
                      ...comorbidities.flags,
                      [item.id]: e.target.checked,
                    };
                    onComorbiditiesChange({ ...comorbidities, flags });
                    saveComorbidities(flags, comorbidities.other_text);
                  }}
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-sm">
          <span className="text-xs text-navy-800/60">Outras</span>
          <input
            className={`${inputClass} mt-1`}
            value={comorbidities.other_text}
            onChange={(e) =>
              onComorbiditiesChange({
                ...comorbidities,
                other_text: e.target.value,
              })
            }
            onBlur={() =>
              saveComorbidities(comorbidities.flags, comorbidities.other_text)
            }
          />
        </label>
      </section>
    </div>
  );
}
