"use client";

import { useCallback, useMemo, useState } from "react";
import {
  emptyPhysicalExamSystems,
  formatPhysicalExamBlock,
  PHYSICAL_EXAM_NORMAL_TEXT,
  PHYSICAL_EXAM_SYSTEM_LABELS,
  PHYSICAL_EXAM_SYSTEM_ORDER,
  resolveSystemText,
} from "@/lib/inpatient/physical-exam-defaults";
import type {
  EpisodePhysicalExam,
  PhysicalExamSystems,
} from "@/lib/types/inpatient-chart";

type Props = {
  episodeId: string;
  exams: EpisodePhysicalExam[];
  onExamsChange: (exams: EpisodePhysicalExam[]) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function PhysicalExamTab({
  episodeId,
  exams,
  onExamsChange,
}: Props) {
  const lastExam = exams[0] ?? null;
  const [mode, setMode] = useState<"idle" | "form">("idle");
  const [systems, setSystems] = useState<PhysicalExamSystems>(
    emptyPhysicalExamSystems(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => formatPhysicalExamBlock(systems), [systems]);

  const postExam = useCallback(
    async (payload: {
      without_changes: boolean;
      systems: PhysicalExamSystems;
    }) => {
      setSaving(true);
      setError(null);
      const res = await fetch(
        `/api/pacientes/episodios/${episodeId}/exame-fisico`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      setSaving(false);
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar exame físico.");
        return;
      }
      onExamsChange([data.exam, ...exams]);
      setMode("idle");
      setSystems(emptyPhysicalExamSystems());
    },
    [episodeId, exams, onExamsChange],
  );

  async function handleIgualAnterior() {
    if (!lastExam) {
      setError("Não há exame anterior para copiar.");
      return;
    }
    await postExam({
      without_changes: true,
      systems: lastExam.systems,
    });
  }

  function startWithChanges() {
    if (lastExam) {
      setSystems(structuredClone(lastExam.systems));
    } else {
      setSystems(emptyPhysicalExamSystems());
    }
    setMode("form");
    setError(null);
  }

  function startFromZero() {
    setSystems(emptyPhysicalExamSystems());
    setMode("form");
    setError(null);
  }

  return (
    <div className="space-y-6">
      {lastExam && (
        <section className="rounded-lg border border-navy-900/8 bg-navy-50/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-800/55">
            Último exame físico
          </p>
          <p className="mt-1 text-xs text-navy-800/55">
            {new Date(lastExam.recorded_at).toLocaleString("pt-BR")}
            {lastExam.without_changes ? " · Sem alterações" : ""}
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-navy-950">
            {formatPhysicalExamBlock(lastExam.systems)}
          </pre>
        </section>
      )}

      <section className="rounded-lg border border-navy-900/8 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy-950">Novo exame</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || !lastExam}
            onClick={handleIgualAnterior}
            className="rounded-md border border-navy-900/12 px-3 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-50"
          >
            ✅ Igual ao anterior
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={startWithChanges}
            className="rounded-md border border-navy-900/12 px-3 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-50"
          >
            ✏️ Houve mudanças
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={startFromZero}
            className="text-sm text-navy-800/65 underline-offset-2 hover:underline"
          >
            Começar do zero
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>
        )}

        {mode === "form" && (
          <div className="mt-6 space-y-4">
            {PHYSICAL_EXAM_SYSTEM_ORDER.map((key) => (
              <div
                key={key}
                className="rounded-md border border-navy-900/8 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-navy-950">
                    {PHYSICAL_EXAM_SYSTEM_LABELS[key]}
                  </p>
                  <label className="flex items-center gap-2 text-xs text-navy-800">
                    <input
                      type="checkbox"
                      checked={systems[key].altered}
                      onChange={(e) =>
                        setSystems((s) => ({
                          ...s,
                          [key]: {
                            ...s[key],
                            altered: e.target.checked,
                          },
                        }))
                      }
                    />
                    Alterado
                  </label>
                </div>
                <p className="mt-1 text-xs text-navy-800/55">
                  Normal: {PHYSICAL_EXAM_NORMAL_TEXT[key]}
                </p>
                {systems[key].altered && (
                  <textarea
                    className={`${inputClass} mt-2 min-h-[64px]`}
                    placeholder="Descreva o achado..."
                    value={systems[key].note}
                    onChange={(e) =>
                      setSystems((s) => ({
                        ...s,
                        [key]: { ...s[key], note: e.target.value },
                      }))
                    }
                  />
                )}
                <p className="mt-2 text-xs text-navy-800/70">
                  Texto no laudo: {resolveSystemText(key, systems[key])}
                </p>
              </div>
            ))}

            <div className="rounded-md bg-navy-50/60 p-3">
              <p className="text-xs font-medium text-navy-800/55">Prévia</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-navy-950">
                {preview}
              </pre>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                postExam({ without_changes: false, systems })
              }
              className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar exame físico"}
            </button>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy-950">Histórico</h3>
        {exams.length === 0 ? (
          <p className="text-sm text-navy-800/60">Nenhum exame registrado.</p>
        ) : (
          <ul className="space-y-2">
            {exams.map((exam) => (
              <li
                key={exam.id}
                className="rounded-md border border-navy-900/8 bg-white px-4 py-3"
              >
                <p className="text-xs text-navy-800/55">
                  {new Date(exam.recorded_at).toLocaleString("pt-BR")}
                  {exam.without_changes ? " · Sem alterações" : ""}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-navy-950">
                  {formatPhysicalExamBlock(exam.systems)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
