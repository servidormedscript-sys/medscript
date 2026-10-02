"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { comorbidityLabels } from "@/lib/inpatient/comorbidities";
import { buildChartTimeline, formatTimelineBlock } from "@/lib/inpatient/chart-timeline";
import {
  buildEvolutionDraftForMode,
  coreGenerationKindForMode,
} from "@/lib/inpatient/evolution-core-draft";
import {
  EVOLUTION_MODE_LABELS,
  modeUsesRegulationCheck,
  resolveEvolutionDraftMode,
  type EvolutionDraftMode,
} from "@/lib/inpatient/evolution-context";
import { checkRegulationCompleteness } from "@/lib/inpatient/regulation-completeness";
import {
  evolutionDisplayNumber,
  isEvolutionSigned,
  signedEvolutionTimestamps,
} from "@/lib/inpatient/evolution-utils";
import type { EpisodeComorbidities } from "@/lib/types/inpatient-chart";
import {
  detectEvolutionKeywordSuggestions,
  keywordSuggestionDisclaimer,
} from "@/lib/inpatient/evolution-keywords";
import {
  buildAcuteMedicationLines,
  buildActivePrescriptionLines,
} from "@/lib/inpatient/chart-prescription-summary";
import type {
  EpisodeConduct,
  EpisodeEvolution,
  EpisodeImagingReport,
  EpisodeLabValue,
  EpisodeMedReconciliation,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeProblem,
  EpisodeTreatmentResponse,
  EpisodeVitalRecord,
  PrescriptionInput,
  TreatmentResponseStatus,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import SimpleRichTextEditor, {
  htmlToPlainText,
} from "./SimpleRichTextEditor";

type Props = {
  episodeId: string;
  patient: Patient;
  episode: PatientEpisode;
  vitalRecords: EpisodeVitalRecord[];
  physicalExams: EpisodePhysicalExam[];
  evolutions: EpisodeEvolution[];
  onEvolutionsChange: (items: EpisodeEvolution[]) => void;
  prescriptions: EpisodePrescription[];
  reconciliation: EpisodeMedReconciliation[];
  onAddPrescription?: (input: PrescriptionInput) => Promise<boolean>;
  labValues?: EpisodeLabValue[];
  imagingReports?: EpisodeImagingReport[];
  conduct: EpisodeConduct | null;
  comorbidities?: EpisodeComorbidities | null;
  problems: EpisodeProblem[];
  dischargeConfirmed: boolean;
};

const RESPONSE_OPTIONS: { value: TreatmentResponseStatus; label: string }[] = [
  { value: "melhora", label: "Melhora" },
  { value: "sem_mudanca", label: "Sem mudança" },
  { value: "piora", label: "Piora" },
];

export default function EvolutionTab({
  episodeId,
  patient,
  episode,
  vitalRecords,
  physicalExams,
  evolutions,
  onEvolutionsChange,
  prescriptions,
  reconciliation,
  onAddPrescription,
  labValues = [],
  imagingReports = [],
  conduct,
  comorbidities,
  problems,
  dischargeConfirmed,
}: Props) {
  const [editorHtml, setEditorHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordPlain, setKeywordPlain] = useState("");
  const [manualMode, setManualMode] = useState<EvolutionDraftMode | null>(
    null,
  );
  const [coreCount, setCoreCount] = useState(0);
  const [lastCoreAt, setLastCoreAt] = useState<string | null>(null);
  const [storedTimeline, setStoredTimeline] = useState<
    { occurred_at: string; event_type: string; summary_text: string }[]
  >([]);
  const [treatmentResponses, setTreatmentResponses] = useState<
    EpisodeTreatmentResponse[]
  >([]);
  const [responseDrafts, setResponseDrafts] = useState<
    Record<string, { status: TreatmentResponseStatus; notes: string }>
  >({});
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [addendumParentId, setAddendumParentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/pacientes/episodios/${episodeId}/evolucoes/contexto`,
      );
      const data = await res.json();
      if (cancelled || !res.ok) return;
      setCoreCount(data.core_generations_count ?? 0);
      setLastCoreAt(data.last_core_generated_at ?? null);
      setStoredTimeline(data.stored_timeline ?? []);
      setTreatmentResponses(data.treatment_responses ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [episodeId, evolutions.length]);

  const suggestedMode = useMemo(
    () =>
      resolveEvolutionDraftMode({
        episodeStatus: episode.status,
        conduct,
        coreGenerationsCount: coreCount,
        dischargeConfirmed,
        manualMode,
      }),
    [
      episode.status,
      conduct,
      coreCount,
      dischargeConfirmed,
      manualMode,
    ],
  );

  const timeline = useMemo(
    () =>
      buildChartTimeline({
        episode,
        evolutions,
        prescriptions,
        vitals: vitalRecords,
        storedEvents: storedTimeline,
      }),
    [
      episode,
      evolutions,
      prescriptions,
      vitalRecords,
      storedTimeline,
    ],
  );

  const pendencies = useMemo(() => {
    if (!conduct || !modeUsesRegulationCheck(suggestedMode)) return [];
    return checkRegulationCompleteness({
      episode,
      conduct,
      evolutionTimestamps: signedEvolutionTimestamps(evolutions),
      physicalExams,
      prescriptions,
      noSpecificTreatmentAcknowledged: conduct?.no_specific_treatment,
    });
  }, [
    conduct,
    suggestedMode,
    episode,
    evolutions,
    physicalExams,
    prescriptions,
    conduct?.no_specific_treatment,
  ]);

  const draftCtx = useMemo(
    () => ({
      patient,
      episode,
      vitalRecords,
      physicalExams,
      acuteMedicationLines: buildAcuteMedicationLines(prescriptions),
      activePrescriptionLines: buildActivePrescriptionLines(prescriptions),
      labValues,
      imagingReports,
      conductText: conduct?.conduct_text,
      comorbidities: comorbidityLabels(comorbidities?.flags ?? {}),
    }),
    [
      patient,
      episode,
      vitalRecords,
      physicalExams,
      prescriptions,
      labValues,
      imagingReports,
      conduct?.conduct_text,
      comorbidities,
    ],
  );

  const generateDraft = useCallback(() => {
    if (
      modeUsesRegulationCheck(suggestedMode) &&
      pendencies.length > 0
    ) {
      setError(
        "Resolva as pendências de regulação antes de gerar este rascunho.",
      );
      return;
    }
    const html = buildEvolutionDraftForMode(suggestedMode, {
      ctx: draftCtx,
      conduct,
      timeline,
      problems,
      treatmentResponses,
      evolutions,
      prescriptions,
      reconciliation,
      lastCoreGeneratedAt: lastCoreAt,
    });
    setEditorHtml(html);
    setKeywordPlain(htmlToPlainText(html));
    setError(null);
  }, [
    suggestedMode,
    pendencies,
    draftCtx,
    conduct,
    timeline,
    problems,
    treatmentResponses,
    evolutions,
    prescriptions,
    reconciliation,
    lastCoreAt,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setKeywordPlain(htmlToPlainText(editorHtml));
    }, 500);
    return () => window.clearTimeout(t);
  }, [editorHtml]);

  const keywordSuggestions = useMemo(
    () => detectEvolutionKeywordSuggestions(keywordPlain),
    [keywordPlain],
  );

  const activeProblems = problems.filter((p) => p.active);

  useEffect(() => {
    const next: Record<
      string,
      { status: TreatmentResponseStatus; notes: string }
    > = {};
    for (const pr of problems.filter((p) => p.active)) {
      const saved = treatmentResponses.find((r) => r.problem_id === pr.id);
      next[pr.id] = {
        status: saved?.response_status ?? "sem_mudanca",
        notes: saved?.notes ?? "",
      };
    }
    setResponseDrafts(next);
  }, [problems, treatmentResponses]);

  async function saveTreatmentResponse(problemId: string) {
    const draft = responseDrafts[problemId];
    if (!draft) return;
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/resposta-tratamento`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: problemId,
          response_status: draft.status,
          notes: draft.notes,
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar resposta ao tratamento.");
      return;
    }
    setTreatmentResponses((prev) => {
      const rest = prev.filter((r) => r.problem_id !== problemId);
      return [...rest, data.response];
    });
  }

  const draftModeForSign = coreGenerationKindForMode(suggestedMode)
    ? suggestedMode
    : undefined;

  function mergeEvolutionList(next: EpisodeEvolution) {
    const rest = evolutions.filter((e) => e.id !== next.id);
    onEvolutionsChange(
      [...rest, next].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
  }

  function startAddendum(parent: EpisodeEvolution) {
    if (!isEvolutionSigned(parent)) return;
    const when = new Date(parent.signed_at ?? parent.created_at).toLocaleString(
      "pt-BR",
    );
    setAddendumParentId(parent.id);
    setEditingDraftId(null);
    setEditorHtml(
      `<p><strong>Adendo</strong> à evolução #${evolutionDisplayNumber(evolutions, parent)} (${when}):</p><p><br></p>`,
    );
    setError(null);
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    const url = editingDraftId
      ? `/api/pacientes/episodios/${episodeId}/evolucoes/${editingDraftId}`
      : `/api/pacientes/episodios/${episodeId}/evolucoes`;
    const res = await fetch(url, {
      method: editingDraftId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_html: editorHtml,
        sign: false,
        ...(addendumParentId && !editingDraftId
          ? { addendum_of_id: addendumParentId }
          : {}),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar rascunho.");
      return;
    }
    mergeEvolutionList(data.evolution);
    setEditingDraftId(data.evolution.id);
    if (addendumParentId) setAddendumParentId(null);
  }

  async function signEvolution() {
    const draftEv = editingDraftId
      ? evolutions.find((e) => e.id === editingDraftId)
      : null;
    const isAddendum = Boolean(addendumParentId || draftEv?.addendum_of_id);
    if (
      !isAddendum &&
      modeUsesRegulationCheck(suggestedMode) &&
      pendencies.length > 0
    ) {
      setError(
        "Resolva as pendências de regulação antes de assinar este documento.",
      );
      return;
    }
    setSaving(true);
    setError(null);

    let draftId = editingDraftId;
    if (!draftId) {
      const createRes = await fetch(
        `/api/pacientes/episodios/${episodeId}/evolucoes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_html: editorHtml, sign: false }),
        },
      );
      const createData = await createRes.json();
      if (!createRes.ok) {
        setSaving(false);
        setError(createData.error ?? "Erro ao preparar assinatura.");
        return;
      }
      draftId = createData.evolution.id;
      mergeEvolutionList(createData.evolution);
    } else {
      const patchRes = await fetch(
        `/api/pacientes/episodios/${episodeId}/evolucoes/${draftId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_html: editorHtml }),
        },
      );
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        setSaving(false);
        setError(patchData.error ?? "Erro ao atualizar rascunho.");
        return;
      }
      mergeEvolutionList(patchData.evolution);
    }

    const signRes = await fetch(
      `/api/pacientes/episodios/${episodeId}/evolucoes/${draftId}/assinar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_mode: draftModeForSign }),
      },
    );
    const signData = await signRes.json();
    setSaving(false);
    if (!signRes.ok) {
      setError(signData.error ?? "Erro ao assinar evolução.");
      return;
    }
    mergeEvolutionList(signData.evolution);
    if (draftModeForSign) {
      setCoreCount((c) => c + 1);
      setLastCoreAt(new Date().toISOString());
    }
    setEditorHtml("");
    setEditingDraftId(null);
    setManualMode(null);
  }

  function continueEditingDraft(ev: EpisodeEvolution) {
    setEditingDraftId(ev.id);
    setEditorHtml(ev.content_html);
    setError(null);
  }

  async function deleteDraft(ev: EpisodeEvolution) {
    if (isEvolutionSigned(ev)) return;
    if (!window.confirm("Excluir este rascunho de evolução?")) return;
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/evolucoes/${ev.id}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível excluir o rascunho.");
      return;
    }
    onEvolutionsChange(evolutions.filter((e) => e.id !== ev.id));
    if (editingDraftId === ev.id) {
      setEditingDraftId(null);
      setEditorHtml("");
    }
  }

  const modeChips: EvolutionDraftMode[] = [
    "diaria",
    "alta",
    "core_inicial",
    "core_atualizacao",
    "judicializada",
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-navy-900/8 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-navy-950">
              Contexto do rascunho
            </h3>
            <p className="mt-1 text-xs text-navy-800/60">
              O modo sugerido segue conduta e status do paciente. Você pode
              alternar com os chips — o rascunho só concatena dados já
              registrados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modeChips.map((mode) => {
              const active = suggestedMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setManualMode(mode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    active
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-navy-900/15 bg-white text-navy-900 hover:bg-navy-50"
                  }`}
                >
                  {EVOLUTION_MODE_LABELS[mode]}
                </button>
              );
            })}
            {manualMode && (
              <button
                type="button"
                onClick={() => setManualMode(null)}
                className="rounded-full px-3 py-1 text-xs text-navy-800/70 underline"
              >
                Usar sugestão automática
              </button>
            )}
          </div>
        </div>

        {timeline.length > 0 && (
          <details className="mt-4 rounded-md border border-navy-900/10 bg-white p-3">
            <summary className="cursor-pointer text-sm font-medium text-navy-950">
              Linha do tempo clínica ({timeline.length} eventos)
            </summary>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-navy-900/85">
              {formatTimelineBlock(timeline.slice(0, 25))}
            </pre>
          </details>
        )}

        {pendencies.length > 0 && (
          <div
            className="mt-4 rounded-md border border-amber-300 bg-amber-50/90 p-3"
            role="status"
          >
            <p className="text-sm font-medium text-amber-950">
              Pendências para regulação / CORE
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-950/90">
              {pendencies.map((p) => (
                <li key={p.id}>{p.label}</li>
              ))}
            </ul>
          </div>
        )}

        {activeProblems.length > 0 && (
          <div className="mt-4 rounded-md border border-navy-900/10 bg-navy-50/40 p-3">
            <p className="text-sm font-medium text-navy-950">
              Resposta ao tratamento (por problema)
            </p>
            <p className="mt-1 text-xs text-navy-800/60">
              Informe explicitamente — o sistema não infere melhora ou piora.
            </p>
            <ul className="mt-3 space-y-3">
              {activeProblems.map((pr) => (
                <li
                  key={pr.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy-900">
                      {pr.text}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <select
                        value={responseDrafts[pr.id]?.status ?? "sem_mudanca"}
                        onChange={(e) =>
                          setResponseDrafts((d) => ({
                            ...d,
                            [pr.id]: {
                              status: e.target.value as TreatmentResponseStatus,
                              notes: d[pr.id]?.notes ?? "",
                            },
                          }))
                        }
                        className="rounded border border-navy-900/15 px-2 py-1 text-xs"
                      >
                        {RESPONSE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Observação opcional"
                        value={responseDrafts[pr.id]?.notes ?? ""}
                        onChange={(e) =>
                          setResponseDrafts((d) => ({
                            ...d,
                            [pr.id]: {
                              status: d[pr.id]?.status ?? "sem_mudanca",
                              notes: e.target.value,
                            },
                          }))
                        }
                        className="min-w-[12rem] flex-1 rounded border border-navy-900/15 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveTreatmentResponse(pr.id)}
                    className="shrink-0 rounded border border-navy-900/15 px-3 py-1 text-xs font-medium hover:bg-white"
                  >
                    Salvar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy-950">
              Nova evolução
            </h3>
            <p className="mt-1 text-xs text-navy-800/60">
              Modo ativo:{" "}
              <span className="font-medium text-navy-950">
                {EVOLUTION_MODE_LABELS[suggestedMode]}
              </span>
              . O rascunho automático usa apenas dados já registrados no
              prontuário.
            </p>
          </div>
          <button
            type="button"
            onClick={generateDraft}
            className="shrink-0 rounded-md border border-navy-900/12 bg-navy-50 px-4 py-2 text-sm font-medium text-navy-950 hover:bg-navy-100"
          >
            ✨ Gerar rascunho automático
          </button>
        </div>

        <div className="mt-4">
          <SimpleRichTextEditor value={editorHtml} onChange={setEditorHtml} />
        </div>

        {keywordSuggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            {keywordSuggestions.map((card) => (
              <div
                key={card.id}
                className="rounded-md border border-amber-200 bg-amber-50/80 p-3 text-sm text-navy-950"
              >
                <p className="font-medium text-amber-950">{card.triggerLabel}</p>
                {card.warning && (
                  <p className="mt-1 text-xs text-amber-900">{card.warning}</p>
                )}
                <div
                  className="mt-2 text-sm text-navy-900"
                  dangerouslySetInnerHTML={{ __html: card.suggestionHtml }}
                />
                {card.medications.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {card.medications.map((med) => (
                      <li key={med.name} className="flex flex-wrap items-center gap-2">
                        <span>
                          <strong>{med.name}</strong> — {med.detail}
                        </span>
                        <button
                          type="button"
                          disabled={!onAddPrescription}
                          onClick={() =>
                            onAddPrescription?.({
                              name: med.name,
                              dose: med.detail.split("—")[0]?.trim() ?? "",
                              route: med.detail.includes("EV")
                                ? "EV"
                                : med.detail.includes("IM")
                                  ? "IM"
                                  : med.detail.includes("SC")
                                    ? "SC"
                                    : "",
                              frequency: "dose única",
                              indication: card.triggerLabel,
                              duration_days: null,
                              use_continuous: false,
                            })
                          }
                          className="rounded border border-navy-900/15 px-2 py-0.5 text-[11px] font-medium text-navy-900 hover:bg-white disabled:opacity-50"
                        >
                          Adicionar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[11px] text-navy-800/55">
                  {keywordSuggestionDisclaimer()}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={saveDraft}
            className="rounded-md border border-navy-900/15 bg-white px-4 py-2 text-sm font-medium text-navy-950 hover:bg-navy-50 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={signEvolution}
            className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {saving ? "Assinando..." : "Assinar evolução"}
          </button>
        </div>
        {(editingDraftId || addendumParentId) && (
          <p className="mt-2 text-xs text-navy-800/60">
            {addendumParentId
              ? "Rascunho de adendo — salve e assine para registrar a correção."
              : "Editando rascunho — após assinar, o texto fica imutável no prontuário."}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy-950">Histórico</h3>
        {evolutions.length === 0 ? (
          <p className="text-sm text-navy-800/60">Nenhuma evolução salva.</p>
        ) : (
          <ul className="space-y-4">
            {evolutions.map((ev) => (
              <li
                key={ev.id}
                className="rounded-md border border-navy-900/8 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-navy-800/55">
                  <span className="font-medium text-navy-900">
                    #{evolutionDisplayNumber(evolutions, ev)}
                  </span>
                  <span>
                    {new Date(ev.created_at).toLocaleString("pt-BR")}
                    {ev.author_name ? ` · ${ev.author_name}` : ""}
                  </span>
                  {ev.addendum_of_id && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-900">
                      Adendo
                    </span>
                  )}
                  {isEvolutionSigned(ev) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                      Assinada
                      {ev.signed_at
                        ? ` · ${new Date(ev.signed_at).toLocaleString("pt-BR")}`
                        : ""}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-950">
                      Rascunho
                    </span>
                  )}
                  {isEvolutionSigned(ev) && (
                    <button
                      type="button"
                      onClick={() => startAddendum(ev)}
                      className="text-[11px] font-medium text-navy-900 underline"
                    >
                      Adicionar adendo
                    </button>
                  )}
                  {!isEvolutionSigned(ev) && (
                    <>
                      <button
                        type="button"
                        onClick={() => continueEditingDraft(ev)}
                        className="text-[11px] font-medium text-navy-900 underline"
                      >
                        Continuar editando
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(ev)}
                        className="text-[11px] font-medium text-red-800 underline"
                      >
                        Excluir rascunho
                      </button>
                    </>
                  )}
                </div>
                <div
                  className="prose prose-sm mt-3 max-w-none text-navy-950"
                  dangerouslySetInnerHTML={{ __html: ev.content_html }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
