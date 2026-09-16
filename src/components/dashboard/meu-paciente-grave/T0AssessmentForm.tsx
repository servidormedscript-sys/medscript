"use client";

import {
  COMPLEMENTARY_SECTIONS,
  EXAM_SECTIONS,
} from "@/lib/clinical/t0-form-config";
import type { ClinicalSuggestion, VitalSigns } from "@/lib/types/clinical-assessment";
import { T0SectionIcon } from "@/lib/clinical/t0-section-icons";
import CheckboxSection from "./CheckboxSection";
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
  suggestions: ClinicalSuggestion[];
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
  suggestions,
  message,
  savedSummary,
  actions,
}: T0AssessmentFormProps) {
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
            {COMPLEMENTARY_SECTIONS.map((section) => (
              <CheckboxSection
                key={section.id}
                section={section}
                values={complementary}
                onChange={onComplementaryChange}
                optional
                labelPrefix="Possui:"
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </section>
      )}

      {suggestions.length > 0 && (
        <SuggestionsPanel suggestions={suggestions} />
      )}

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

function SuggestionsPanel({
  suggestions,
}: {
  suggestions: ClinicalSuggestion[];
}) {
  const priorityStyles = {
    alta: "border-red-200 bg-red-50 text-red-900",
    media: "border-amber-200 bg-amber-50 text-amber-900",
    baixa: "border-navy-900/10 bg-navy-50 text-navy-800",
  };

  return (
    <section className="rounded-lg border border-navy-900/8 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <T0SectionIcon sectionId="clinical_suggestions" />
        <div>
          <h3 className="text-sm font-medium text-navy-950">
            Sugestões clínicas
          </h3>
          <p className="mt-1 text-xs text-navy-800/55">
            Com base nos achados preenchidos. Confirme sempre com avaliação médica.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className={`rounded-md border p-3 ${priorityStyles[s.priority]}`}
          >
            <p className="text-sm font-medium">{s.title}</p>
            <p className="mt-1 text-xs opacity-90">{s.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
