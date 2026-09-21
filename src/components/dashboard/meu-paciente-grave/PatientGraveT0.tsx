"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import {
  buildEmptyChecklist,
  COMPLEMENTARY_SECTIONS,
  EXAM_SECTIONS,
} from "@/lib/clinical/t0-form-config";
import { generateGraveScoring, buildInternacaoNoteFromGrave, type BaselineSnapshot } from "@/lib/clinical/suggestion-rules";
import type {
  ActivePatientEpisode,
  VitalSigns,
} from "@/lib/types/clinical-assessment";
import { EMPTY_VITAL_SIGNS } from "@/lib/types/clinical-assessment";
import { STATUS_LABELS, RISK_LABELS, type RiskLevel } from "@/lib/types/patient";
import { formatAge } from "@/lib/utils/age";
import StandaloneReportsPanel, {
  type StandaloneReport,
} from "./StandaloneReportsPanel";
import T0AssessmentForm from "./T0AssessmentForm";

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function hasComplementaryData(complementary: Record<string, boolean>) {
  return Object.values(complementary).some(Boolean);
}

type ReportFormSnapshot = {
  vitalSigns: VitalSigns;
  findings: Record<string, boolean>;
  complementary: Record<string, boolean>;
  standaloneTitle: string;
  showComplementary: boolean;
  savedSummary: string | null;
};

export default function PatientGraveT0() {
  const searchParams = useSearchParams();
  const episodeFromUrl = searchParams.get("episode");
  const [patients, setPatients] = useState<ActivePatientEpisode[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [standaloneMode, setStandaloneMode] = useState(false);
  const [standaloneTitle, setStandaloneTitle] = useState("");
  const [showStandaloneReports, setShowStandaloneReports] = useState(false);
  const [reportView, setReportView] = useState<StandaloneReport | null>(null);
  const [reportEditing, setReportEditing] = useState(false);
  const [reportBackup, setReportBackup] = useState<ReportFormSnapshot | null>(
    null
  );
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showComplementary, setShowComplementary] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medio");
  const [savedSummary, setSavedSummary] = useState<string | null>(null);

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(EMPTY_VITAL_SIGNS);
  const [findings, setFindings] = useState(() => buildEmptyChecklist(EXAM_SECTIONS));
  const [complementary, setComplementary] = useState(() =>
    buildEmptyChecklist(COMPLEMENTARY_SECTIONS)
  );

  const selected = patients.find((p) => p.id === selectedId);
  const canShowForm = reportView !== null || standaloneMode || Boolean(selectedId);
  const formReadOnly = reportView !== null && !reportEditing;

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

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useClinicRealtime(loadPatients);

  useEffect(() => {
    if (
      reportView ||
      standaloneMode ||
      !episodeFromUrl ||
      loadingPatients ||
      patients.length === 0
    ) {
      return;
    }
    if (patients.some((p) => p.id === episodeFromUrl)) {
      setSelectedId(episodeFromUrl);
    }
  }, [episodeFromUrl, loadingPatients, patients, standaloneMode, reportView]);

  useEffect(() => {
    if (!selectedId) {
      setBaseline(null);
      return;
    }

    let cancelled = false;

    async function loadBaseline() {
      const res = await fetch(
        `/api/paciente-grave/baseline?episode_id=${encodeURIComponent(selectedId)}`
      );
      if (cancelled) return;

      if (res.ok) {
        const data = await res.json();
        if (data.baseline) {
          setBaseline(data.baseline as BaselineSnapshot);
          return;
        }
      }

      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`mpg-baseline-${selectedId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as BaselineSnapshot;
          setBaseline(parsed);
          void fetch("/api/paciente-grave/baseline", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ episode_id: selectedId, baseline: parsed }),
          }).then(() => localStorage.removeItem(`mpg-baseline-${selectedId}`));
        } else {
          setBaseline(null);
        }
      }
    }

    void loadBaseline();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const scoring = useMemo(
    () => generateGraveScoring(vitalSigns, findings),
    [vitalSigns, findings]
  );

  const suggestions = useMemo(
    () =>
      scoring.suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.reasons.join(" · "),
        priority:
          s.badge === "prioridade_alta"
            ? ("alta" as const)
            : s.badge === "considerar"
              ? ("media" as const)
              : ("baixa" as const),
        score: s.score,
        reasons: s.reasons,
      })),
    [scoring]
  );

  function updateFinding(id: string, checked: boolean) {
    if (formReadOnly) return;
    setFindings((prev) => ({ ...prev, [id]: checked }));
  }

  function updateComplementary(id: string, checked: boolean) {
    if (formReadOnly) return;
    setComplementary((prev) => ({ ...prev, [id]: checked }));
  }

  function resetForm() {
    setVitalSigns(EMPTY_VITAL_SIGNS);
    setFindings(buildEmptyChecklist(EXAM_SECTIONS));
    setComplementary(buildEmptyChecklist(COMPLEMENTARY_SECTIONS));
    setShowComplementary(false);
    setSavedSummary(null);
    if (!standaloneMode && !reportView) {
      setStandaloneTitle("");
    }
  }

  function handleStandaloneToggle(checked: boolean) {
    setStandaloneMode(checked);
    setMessage(null);
    setSavedSummary(null);
    if (checked) {
      setSelectedId("");
    } else {
      setStandaloneTitle("");
    }
  }

  function loadReportIntoForm(report: StandaloneReport) {
    setVitalSigns(report.vital_signs ?? EMPTY_VITAL_SIGNS);
    setFindings(report.findings ?? buildEmptyChecklist(EXAM_SECTIONS));
    setComplementary(
      report.complementary ?? buildEmptyChecklist(COMPLEMENTARY_SECTIONS)
    );
    setStandaloneTitle(report.title ?? "");
    setShowComplementary(hasComplementaryData(report.complementary ?? {}));
    setSavedSummary(report.summary ?? null);
    setMessage(null);
  }

  function handleViewReport(report: StandaloneReport) {
    setShowStandaloneReports(false);
    setReportView(report);
    setReportEditing(false);
    setReportBackup(null);
    loadReportIntoForm(report);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCloseReportView() {
    setReportView(null);
    setReportEditing(false);
    setReportBackup(null);
    resetForm();
    setMessage(null);
  }

  function handleStartReportEdit() {
    setReportBackup({
      vitalSigns,
      findings,
      complementary,
      standaloneTitle,
      showComplementary,
      savedSummary,
    });
    setReportEditing(true);
    setMessage(null);
  }

  function handleCancelReportEdit() {
    if (reportBackup) {
      setVitalSigns(reportBackup.vitalSigns);
      setFindings(reportBackup.findings);
      setComplementary(reportBackup.complementary);
      setStandaloneTitle(reportBackup.standaloneTitle);
      setShowComplementary(reportBackup.showComplementary);
      setSavedSummary(reportBackup.savedSummary);
    }
    setReportEditing(false);
    setReportBackup(null);
    setMessage(null);
  }

  async function handleSave() {
    if (!standaloneMode && !selectedId) {
      setMessage({ type: "error", text: "Selecione um paciente ativo." });
      return;
    }

    if (standaloneMode && !standaloneTitle.trim()) {
      setMessage({
        type: "error",
        text: "Informe um título para identificar esta T0 avulsa.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/paciente-grave/t0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episode_id: standaloneMode ? undefined : selectedId,
        standalone: standaloneMode,
        title: standaloneMode ? standaloneTitle.trim() : undefined,
        vital_signs: vitalSigns,
        findings,
        complementary,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao salvar T0." });
      return;
    }

    setSavedSummary(data.summary);
    setMessage({
      type: "success",
      text: standaloneMode
        ? "T0 avulsa salva. Consulte pelo botão Relatórios avulsos."
        : "Laudo T0 salvo na ficha do paciente.",
    });
  }

  async function handleUpdateReport() {
    if (!reportView) return;

    if (!standaloneTitle.trim()) {
      setMessage({
        type: "error",
        text: "Informe um título para identificar esta T0 avulsa.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await fetch(`/api/paciente-grave/t0/avulsos/${reportView.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: standaloneTitle.trim(),
        vital_signs: vitalSigns,
        findings,
        complementary,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({
        type: "error",
        text: data.error ?? "Erro ao salvar alterações.",
      });
      return;
    }

    const updatedReport: StandaloneReport = {
      id: reportView.id,
      title: standaloneTitle.trim(),
      summary: data.summary,
      vital_signs: vitalSigns,
      findings,
      complementary,
      created_at: reportView.created_at,
    };

    setReportView(updatedReport);
    setSavedSummary(data.summary);
    setReportEditing(false);
    setReportBackup(null);
    setMessage({ type: "success", text: "Laudo avulso atualizado." });
  }

  async function saveBaselineSnapshot() {
    if (!selectedId) return;
    const snap: BaselineSnapshot = {
      savedAt: new Date().toISOString(),
      vital: vitalSigns,
      findings,
      topId: scoring.suggestions[0]?.id ?? null,
      topScore: scoring.suggestions[0]?.score ?? 0,
    };
    const res = await fetch("/api/paciente-grave/baseline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episode_id: selectedId, baseline: snap }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Erro ao salvar linha de base." });
      return;
    }
    setBaseline(snap);
    setMessage({ type: "success", text: "Linha de base T0 salva para comparação." });
  }

  async function clearBaselineSnapshot() {
    if (!selectedId) return;
    const res = await fetch("/api/paciente-grave/baseline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episode_id: selectedId, baseline: null }),
    });
    if (res.ok) setBaseline(null);
  }

  async function handleInternar() {
    if (!selectedId || standaloneMode) return;
    const top = scoring.suggestions[0];
    const diag = scoring.pcr
      ? "PCR — Parada Cardiorrespiratória (suspeita — triagem Meu Paciente Grave)"
      : top
        ? `${top.title} (suspeita — triagem Meu Paciente Grave)`
        : "";
    const report = buildInternacaoNoteFromGrave({
      findings,
      complementary,
      vital: vitalSigns,
      topSuggestion: top
        ? {
            id: top.id,
            title: top.title,
            description: top.reasons.join(" · "),
            priority: "alta",
          }
        : null,
      pcr: scoring.pcr,
    });
    const vitalsLine = [
      vitalSigns.temperature && `Temp ${vitalSigns.temperature}°C`,
      vitalSigns.heart_rate && `FC ${vitalSigns.heart_rate}`,
      vitalSigns.respiratory_rate && `FR ${vitalSigns.respiratory_rate}`,
      vitalSigns.systolic_bp && `PAS ${vitalSigns.systolic_bp}`,
      vitalSigns.spo2 && `SpO₂ ${vitalSigns.spo2}%`,
      vitalSigns.blood_glucose && `Glicemia ${vitalSigns.blood_glucose}`,
    ]
      .filter(Boolean)
      .join(" · ");

    setSaving(true);
    const res = await fetch(`/api/pacientes/episodios/${selectedId}/mover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_status: "internado",
        risk_level: riskLevel,
        diagnosis: diag || undefined,
        initial_assessment: vitalsLine ? `Vitais (T0): ${vitalsLine}` : undefined,
        report_text: `${diag ? `${diag}\n\n` : ""}${vitalsLine ? `Vitais: ${vitalsLine}\n\n` : ""}${report}`,
        weight: vitalSigns.weight,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Não foi possível internar." });
      return;
    }
    setMessage({ type: "success", text: "Paciente movido para internado." });
    loadPatients();
  }

  return (
    <div className="space-y-6">
      {reportView ? (
        <section className="rounded-lg border border-navy-900/8 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-navy-800/50">
                Laudo avulso
              </p>
              <h2 className="mt-1 text-lg font-medium text-navy-950">
                {reportView.title}
              </h2>
              <p className="mt-1 text-sm text-navy-800/60">
                Salvo em{" "}
                {new Date(reportView.created_at).toLocaleString("pt-BR")}
                {formReadOnly && " · somente leitura"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseReportView}
              className="rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50"
            >
              Voltar
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-navy-900/8 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-navy-950">
              Selecionar paciente ativo
            </h2>
            <button
              type="button"
              onClick={() => setShowStandaloneReports(true)}
              className="rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50"
            >
              Relatórios avulsos
            </button>
          </div>

          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-md border border-navy-900/8 bg-navy-50/40 p-3">
            <input
              type="checkbox"
              checked={standaloneMode}
              onChange={(e) => handleStandaloneToggle(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-navy-900/20"
            />
            <span>
              <span className="block text-sm font-medium text-navy-950">
                T0 avulsa (sem paciente vinculado)
              </span>
              <span className="mt-0.5 block text-xs text-navy-800/60">
                Abre a ficha T0 sem selecionar paciente. Informe um título antes
                de salvar para localizar depois em Relatórios avulsos.
              </span>
            </span>
          </label>

          {!standaloneMode && (
            <>
              {loadingPatients ? (
                <p className="text-sm text-navy-800/60">Carregando pacientes...</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-navy-800/60">
                  Nenhum paciente ativo no Kanban. Cadastre um paciente em
                  Relatório de Pacientes ou marque T0 avulsa acima.
                </p>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    resetForm();
                  }}
                  className="w-full rounded-md border border-navy-900/12 bg-white px-3 py-2.5 text-sm text-navy-950 outline-none focus:border-navy-700 md:max-w-xl"
                >
                  <option value="">Selecione o paciente</option>
                  {patients.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.patient.full_name} — CPF {formatCpf(ep.patient.cpf)} —{" "}
                      {STATUS_LABELS[ep.status as keyof typeof STATUS_LABELS] ??
                        ep.status}
                    </option>
                  ))}
                </select>
              )}

              {selected && (
                <p className="mt-3 text-sm text-navy-800/65">
                  Avaliação de <strong>{selected.patient.full_name}</strong>
                  {selected.patient.birth_date && (
                    <> · {formatAge(selected.patient.birth_date)}</>
                  )}
                  {" · Ficha #"}
                  {selected.episode_number}
                </p>
              )}
              {selected && (
                <label className="mt-3 block text-sm">
                  Classificação de risco (internação)
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                    className="mt-1 rounded-md border px-3 py-2 text-sm"
                  >
                    {(Object.keys(RISK_LABELS) as RiskLevel[]).map((risk) => (
                      <option key={risk} value={risk}>
                        {RISK_LABELS[risk]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          {standaloneMode && (
            <p className="text-sm text-navy-800/65">
              Modo avulso ativo — preencha a ficha T0 abaixo e defina um título
              antes de salvar.
            </p>
          )}
        </section>
      )}

      {canShowForm && (
        <T0AssessmentForm
          readOnly={formReadOnly}
          showStandaloneTitle={standaloneMode || reportView !== null}
          standaloneTitle={standaloneTitle}
          onStandaloneTitleChange={setStandaloneTitle}
          vitalSigns={vitalSigns}
          onVitalSignsChange={formReadOnly ? () => {} : setVitalSigns}
          findings={findings}
          onFindingChange={updateFinding}
          complementary={complementary}
          onComplementaryChange={updateComplementary}
          showComplementary={showComplementary}
          onToggleComplementary={() => setShowComplementary((v) => !v)}
          scoring={scoring}
          baseline={baseline}
          onSaveBaseline={!standaloneMode && selectedId ? saveBaselineSnapshot : undefined}
          onClearBaseline={baseline ? clearBaselineSnapshot : undefined}
          onInternar={!standaloneMode && selectedId ? handleInternar : undefined}
          internarDisabled={saving}
          message={message}
          savedSummary={formReadOnly ? null : savedSummary}
          actions={
            reportView ? (
              reportEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelReportEdit}
                    className="rounded-md border border-navy-900/12 px-5 py-2.5 text-sm font-medium text-navy-800"
                  >
                    Cancelar edição
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateReport}
                    disabled={saving}
                    className="rounded-md bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartReportEdit}
                  className="rounded-md bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
                >
                  Editar laudo
                </button>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-navy-900/12 px-5 py-2.5 text-sm font-medium text-navy-800"
                >
                  Limpar formulário
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : standaloneMode
                      ? "Salvar T0 avulsa"
                      : "Salvar laudo T0 na ficha"}
                </button>
              </>
            )
          }
        />
      )}

      {showStandaloneReports && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-navy-900/10 bg-white shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-medium text-navy-950">
                  Relatórios avulsos
                </h2>
                <p className="text-sm text-navy-800/60">
                  T0 sem paciente vinculado, identificadas pelo título.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStandaloneReports(false)}
                className="text-navy-800/50 hover:text-navy-800"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <StandaloneReportsPanel
                embedded
                isOpen={showStandaloneReports}
                onViewReport={handleViewReport}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
