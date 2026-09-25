"use client";

import Link from "next/link";
import {
  COMPLEMENTARY_SECTIONS,
  buildRosCopyText,
  EXAM_SECTIONS,
  ISDA_ITEM_COUNT,
} from "@/lib/clinical/t0-form-config";
import type { GraveScoringResult } from "@/lib/clinical/suggestion-rules";
import { compareEvolution, type BaselineSnapshot } from "@/lib/clinical/suggestion-rules";
import type { ClinicalSuggestion, VitalSigns } from "@/lib/types/clinical-assessment";
import { T0SectionIcon } from "@/lib/clinical/t0-section-icons";
import CheckboxSection from "./CheckboxSection";
import CollapsibleCheckboxSection from "./CollapsibleCheckboxSection";
import VitalSignsForm from "./VitalSignsForm";

type T0AssessmentFormProps = {
  readOnly?: boolean;
  showStandaloneTitle?: boolean;
  standaloneTitle?: string;
  onStandaloneTitleChange?: (value: string) => void;
  vitalSigns: VitalSigns;
  onVitalSignsChange: (values: VitalSigns) => void;
  findings: Record<string, boolean>;
  onFindingChange: (id: string, checked: boolean) => void;
  complementary: Record<string, boolean>;
  onComplementaryChange: (id: string, checked: boolean) => void;
  showComplementary: boolean;
  onToggleComplementary: () => void;
  scoring: GraveScoringResult;
  baseline: BaselineSnapshot | null;
  onSaveBaseline?: () => void;
  onClearBaseline?: () => void;
  onInternar?: () => void;
  internarDisabled?: boolean;
  message?: { type: "success" | "error"; text: string } | null;
  savedSummary?: string | null;
  actions: React.ReactNode;
};

export default function T0AssessmentForm({
  readOnly = false,
  showStandaloneTitle = false,
  standaloneTitle = "",
  onStandaloneTitleChange,
  vitalSigns,
  onVitalSignsChange,
  findings,
  onFindingChange,
  complementary,
  onComplementaryChange,
  showComplementary,
  onToggleComplementary,
  scoring,
  baseline,
  onSaveBaseline,
  onClearBaseline,
  onInternar,
  internarDisabled,
  message,
  savedSummary,
  actions,
}: T0AssessmentFormProps) {
  function copyRos() {
    void navigator.clipboard.writeText(buildRosCopyText(complementary));
  }
  return (
    <>
      {showStandaloneTitle && (
        <section className="rounded-lg border border-navy-900/8 bg-white p-5">
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            Título da T0 avulsa *
          </label>
          <input
            value={standaloneTitle}
            onChange={(e) => onStandaloneTitleChange?.(e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            placeholder="Ex: Plantão noturno — suspeita sepse leito 4"
            className="w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700 disabled:cursor-default disabled:bg-navy-50/60 md:max-w-xl"
          />
          {!readOnly && (
            <p className="mt-1.5 text-xs text-navy-800/55">
              Este título aparecerá na lista de Relatórios avulsos.
            </p>
          )}
        </section>
      )}

      <VitalSignsForm
        values={vitalSigns}
        onChange={onVitalSignsChange}
        readOnly={readOnly}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <T0SectionIcon sectionId="exam_findings" />
          <h2 className="text-sm font-medium text-navy-950">
            Achados clínicos no exame
          </h2>
        </div>
        {EXAM_SECTIONS.map((section) => (
          <CheckboxSection
            key={section.id}
            section={section}
            values={findings}
            onChange={onFindingChange}
            readOnly={readOnly}
          />
        ))}
      </div>

      {( !readOnly || showComplementary ) && (
      <section className="rounded-lg border border-navy-900/8 bg-white p-5">
        {!readOnly && (
          <button
            type="button"
            onClick={onToggleComplementary}
            className="text-sm font-medium text-navy-900 underline-offset-2 hover:underline"
          >
            {showComplementary
              ? "Ocultar relatório complementar"
              : "Preencher relatório complementar (opcional)"}
          </button>
        )}

        {readOnly && showComplementary && (
          <div className="mb-4 flex items-center gap-3">
            <T0SectionIcon sectionId="complementary_report" />
            <h3 className="text-sm font-medium text-navy-950">
              Relatório complementar
            </h3>
          </div>
        )}

        {showComplementary && (
          <div className={readOnly ? "space-y-4" : "mt-4 space-y-4"}>
            <p className="text-xs text-navy-800/55">
              ISDA — {ISDA_ITEM_COUNT} itens em {COMPLEMENTARY_SECTIONS.length} sistemas (expanda cada bloco).
            </p>
            {!readOnly && (
              <button type="button" onClick={copyRos} className="text-xs font-medium text-ocean-800 underline">
                Copiar ISDA para prontuário
              </button>
            )}
            {complementary.ideacao_suicida && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                Ideação suicida marcada —{" "}
                <Link href="/dashboard/protocolos-clinicos?category=saude-mental-uti&protocol=risco-suicidio" className="font-semibold underline">
                  Risco de suicídio
                </Link>
              </div>
            )}
            {COMPLEMENTARY_SECTIONS.map((section) => (
              <CollapsibleCheckboxSection
                key={section.id}
                section={section}
                values={complementary}
                onChange={onComplementaryChange}
                optional
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </section>
      )}

      <GraveSuggestionsPanel
        scoring={scoring}
        baseline={baseline}
        vitalSigns={vitalSigns}
        findings={findings}
        onSaveBaseline={onSaveBaseline}
        onClearBaseline={onClearBaseline}
        onInternar={onInternar}
        internarDisabled={internarDisabled}
        readOnly={readOnly}
      />

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {savedSummary && (
        <section className="rounded-lg border border-navy-900/8 bg-navy-50/50 p-5">
          <h3 className="mb-2 text-sm font-medium text-navy-950">
            Laudo T0 gerado
          </h3>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-navy-800/80">
            {savedSummary}
          </pre>
        </section>
      )}

      <div className="flex flex-wrap gap-3">{actions}</div>
    </>
  );
}

function GraveSuggestionsPanel({
  scoring,
  baseline,
  vitalSigns,
  findings,
  onSaveBaseline,
  onClearBaseline,
  onInternar,
  internarDisabled,
  readOnly,
}: {
  scoring: GraveScoringResult;
  baseline: BaselineSnapshot | null;
  vitalSigns: VitalSigns;
  findings: Record<string, boolean>;
  onSaveBaseline?: () => void;
  onClearBaseline?: () => void;
  onInternar?: () => void;
  internarDisabled?: boolean;
  readOnly?: boolean;
}) {
  const { pcr, suggestions, hasAnyInput } = scoring;
  const evolution =
    baseline &&
    compareEvolution(baseline, { vital: vitalSigns, findings }, suggestions[0]);

  const badgeClass = {
    prioridade_alta: "bg-red-600 text-white",
    considerar: "bg-amber-500 text-white",
    possivel: "bg-navy-200 text-navy-900",
  };

  return (
    <section className="rounded-lg border border-navy-900/8 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <T0SectionIcon sectionId="clinical_suggestions" />
        <div>
          <h3 className="text-sm font-medium text-navy-950">Sugestão de protocolos</h3>
          <p className="mt-1 text-xs text-navy-800/55">
            16 regras com pontuação aditiva · exibidas as 5 primeiras com ≥2 pts · recalcula em tempo real.
          </p>
        </div>
      </div>

      {pcr && (
        <div className="animate-pulse rounded-lg border-2 border-red-600 bg-red-50 p-4">
          <p className="font-bold text-red-900">PCR — iniciar RCP antes de qualquer investigação</p>
          <Link
            href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto"
            className="mt-2 inline-block rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white"
          >
            Abrir PCR
          </Link>
        </div>
      )}

      {!pcr && suggestions.length === 0 && (
        <p className="text-sm text-navy-800/65">
          {hasAnyInput
            ? "Nenhum protocolo se destacou (nenhuma regra ≥2 pts)."
            : "Marque achados do exame rápido para ver sugestões."}
        </p>
      )}

      {!pcr && suggestions.length > 0 && (
        <ul className="space-y-3">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              className={`rounded-md border p-3 ${
                i === 0 && s.badge === "prioridade_alta" ? "animate-pulse border-red-400 bg-red-50" : "border-navy-900/10 bg-navy-50/40"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeClass[s.badge]}`}>
                  {s.badge === "prioridade_alta"
                    ? "Prioridade alta"
                    : s.badge === "considerar"
                      ? "Considerar"
                      : "Possível"}
                </span>
                <span className="text-xs text-navy-800/60">{s.score} pts</span>
              </div>
              <p className="mt-1 text-sm font-medium text-navy-950">{s.title}</p>
              <p className="mt-1 text-xs text-navy-800/75">{s.reasons.join(" · ")}</p>
              {s.protocolId && s.categoryId ? (
                <Link
                  href={`/dashboard/protocolos-clinicos?category=${s.categoryId}&protocol=${s.protocolId}`}
                  className="mt-2 inline-block text-xs font-semibold text-ocean-800 underline"
                >
                  Abrir protocolo
                </Link>
              ) : (
                <p className="mt-2 text-xs text-navy-800/50">Protocolo ainda não disponível no app</p>
              )}
              {i === 0 && s.badge === "prioridade_alta" && (
                <p className="mt-2 text-xs font-medium text-red-800">
                  Prioridade alta e tempo-dependente — não adie a abertura do protocolo.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {baseline && evolution && evolution.length > 0 && (
        <div className="mt-4 rounded-lg border border-ocean-200 bg-ocean-50/50 p-3 text-xs text-ocean-950">
          <p className="font-semibold">Comparação com T0 ({new Date(baseline.savedAt).toLocaleString("pt-BR")})</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {evolution.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onSaveBaseline && (
            <button type="button" onClick={onSaveBaseline} className="rounded-md border px-3 py-1.5 text-xs font-medium">
              {baseline ? "Atualizar linha de base (T0)" : "Salvar linha de base (T0)"}
            </button>
          )}
          {baseline && onClearBaseline && (
            <button type="button" onClick={onClearBaseline} className="rounded-md border px-3 py-1.5 text-xs font-medium">
              Descartar linha de base
            </button>
          )}
          {onInternar && (
            <button
              type="button"
              onClick={onInternar}
              disabled={internarDisabled}
              className="rounded-md bg-navy-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Internar paciente
            </button>
          )}
        </div>
      )}
    </section>
  );
}
