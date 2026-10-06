"use client";

import { useCallback, useMemo, useState } from "react";
import { LAB_ANALYTES } from "@/lib/inpatient/lab-analytes";
import type { LabAlert } from "@/lib/inpatient/lab-alerts";
import {
  criticalConductDisclaimer,
  type CriticalLabConduct,
} from "@/lib/inpatient/lab-critical-conduct";
import { formatLabDayLines } from "@/lib/inpatient/lab-summary";
import LabOcrImporter from "@/components/inpatient/LabOcrImporter";
import type {
  EpisodeImagingReport,
  EpisodeLabPending,
  EpisodeLabValue,
  PrescriptionInput,
} from "@/lib/types/inpatient-chart";

type LabBundle = {
  values: EpisodeLabValue[];
  pending: EpisodeLabPending[];
  imaging: EpisodeImagingReport[];
  alerts: LabAlert[];
  criticalConducts: CriticalLabConduct[];
};

type Props = {
  episodeId: string;
  bundle: LabBundle;
  onBundleChange: (bundle: LabBundle) => void;
  onAddPrescription?: (input: PrescriptionInput) => Promise<boolean>;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-2 py-1.5 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function LabExamsTab({
  episodeId,
  bundle,
  onBundleChange,
  onAddPrescription,
}: Props) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [collectedAt, setCollectedAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingLabel, setPendingLabel] = useState("");
  const [pendingNote, setPendingNote] = useState("");
  const [pendingUrgent, setPendingUrgent] = useState(false);

  const historyLines = useMemo(
    () => formatLabDayLines(bundle.values),
    [bundle.values],
  );

  const reload = useCallback(async () => {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/exames-laboratorio`,
    );
    const data = await res.json();
    if (res.ok) onBundleChange(data);
  }, [episodeId, onBundleChange]);

  async function saveManualPanel() {
    const entries = Object.entries(formValues)
      .filter(([, v]) => v.trim() !== "")
      .map(([key, v]) => ({
        analyte_key: key,
        value: Number(v.replace(",", ".")),
      }))
      .filter((e) => Number.isFinite(e.value));

    if (entries.length === 0) {
      setError("Informe ao menos um valor.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/exames-laboratorio`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collected_at: new Date(collectedAt).toISOString(),
          entries,
        }),
      },
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }
    setFormValues({});
    await reload();
  }

  async function addPending() {
    if (!pendingLabel.trim()) return;
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/exames-laboratorio/pendentes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: pendingLabel,
          expected_note: pendingNote,
          urgent: pendingUrgent,
        }),
      },
    );
    const data = await res.json();
    if (res.ok) {
      setPendingLabel("");
      setPendingNote("");
      setPendingUrgent(false);
      await reload();
    }
  }

  return (
    <div className="space-y-6">
      {bundle.criticalConducts.length > 0 && (
        <section className="space-y-3">
          {bundle.criticalConducts.map((card) => (
            <div
              key={card.id}
              className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950"
            >
              <p className="font-semibold">{card.title}</p>
              <p className="mt-1">{card.detail}</p>
              <p className="mt-1 text-xs text-red-900/70">{card.source}</p>
              {card.prescriptions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {card.prescriptions.map((rx) => (
                    <li key={rx.name} className="flex flex-wrap gap-2">
                      <span>{rx.name} — {rx.dose} {rx.route}</span>
                      <button
                        type="button"
                        disabled={!onAddPrescription}
                        onClick={() => onAddPrescription?.(rx)}
                        className="rounded border border-red-400 px-2 py-0.5 text-xs font-medium disabled:opacity-50"
                      >
                        Adicionar à prescrição
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px]">{criticalConductDisclaimer()}</p>
            </div>
          ))}
        </section>
      )}

      {bundle.alerts.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
          <h3 className="text-sm font-semibold text-amber-950">Alertas</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {bundle.alerts.map((a, i) => (
              <li key={`${a.analyteKey}-${a.kind}-${i}`}>• {a.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Exames pendentes</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${inputClass} min-w-[10rem] flex-1`}
            placeholder="Tipo (ex. Hemograma)"
            value={pendingLabel}
            onChange={(e) => setPendingLabel(e.target.value)}
          />
          <input
            className={`${inputClass} min-w-[8rem] flex-1`}
            placeholder="Previsão / nota"
            value={pendingNote}
            onChange={(e) => setPendingNote(e.target.value)}
          />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={pendingUrgent}
              onChange={(e) => setPendingUrgent(e.target.checked)}
            />
            Urgente
          </label>
          <button
            type="button"
            onClick={addPending}
            className="rounded-md bg-navy-900 px-3 py-2 text-xs font-medium text-white"
          >
            Solicitar
          </button>
        </div>
        {bundle.pending.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/55">Nenhum pendente.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {bundle.pending.map((p) => {
              const hours = Math.floor(
                (Date.now() - new Date(p.requested_at).getTime()) /
                  (1000 * 60 * 60),
              );
              return (
                <li
                  key={p.id}
                  className={`rounded border px-3 py-2 text-sm ${
                    p.urgent
                      ? "border-red-300 bg-red-50/50"
                      : "border-navy-900/10"
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-navy-800/55">
                    {" "}
                    · solicitado{" "}
                    {new Date(p.requested_at).toLocaleString("pt-BR")} (
                    {hours}h)
                  </span>
                  {p.expected_note && (
                    <p className="text-xs text-navy-800/65">{p.expected_note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">
          Importar laudo (OCR local)
        </h3>
        <p className="mt-1 text-xs text-navy-800/55">
          PDF ou imagem — processado só no seu navegador; confirme na revisão antes
          de salvar.
        </p>
        <div className="mt-2">
          <LabOcrImporter
            episodeId={episodeId}
            onSaved={reload}
            onError={(msg) => msg && setError(msg)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Lançamento manual</h3>
        <label className="mt-2 block text-xs text-navy-800/70">
          Data/hora da coleta
          <input
            type="datetime-local"
            className={`${inputClass} mt-1 max-w-xs`}
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
          />
        </label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_ANALYTES.map((a) => (
            <label key={a.key} className="text-xs text-navy-800/70">
              {a.label} ({a.min}–{a.max} {a.unit})
              <input
                className={`${inputClass} mt-0.5`}
                value={formValues[a.key] ?? ""}
                onChange={(e) =>
                  setFormValues((f) => ({ ...f, [a.key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={saveManualPanel}
          className="mt-4 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar resultados"}
        </button>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-navy-950">
          Histórico por dia
        </h3>
        {historyLines.length === 0 ? (
          <p className="text-sm text-navy-800/60">Nenhum resultado.</p>
        ) : (
          <ul className="space-y-2 text-sm text-navy-900">
            {historyLines.map((line) => (
              <li key={line} className="rounded border border-navy-900/8 bg-white px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        )}
      </section>

      {bundle.imaging.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-navy-950">
            Exames de imagem
          </h3>
          <ul className="space-y-3">
            {bundle.imaging.map((img) => (
              <li
                key={img.id}
                className="rounded border border-navy-900/8 bg-white p-3 text-sm"
              >
                <p className="text-xs text-navy-800/55">
                  {new Date(img.reported_at).toLocaleString("pt-BR")} · {img.title}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-navy-950">
                  {img.body_text}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
