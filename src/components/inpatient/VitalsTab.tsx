"use client";

import { useCallback, useMemo, useState } from "react";
import { getCriticalVitalAlerts, getVitalAlertsForRecord } from "@/lib/inpatient/vital-alerts";
import {
  CARE_LOCATION_LABELS,
  O2_TYPE_LABELS,
  pickUltimoComDispositivo,
  pickUltimoVital,
  summarizeDevices,
  summarizeVitals,
} from "@/lib/inpatient/vital-devices";
import type {
  CareLocation,
  EpisodeVitalRecord,
  O2Type,
  VitalRecordInput,
} from "@/lib/types/inpatient-chart";
import VitalTrendChart from "./VitalTrendChart";

type Props = {
  episodeId: string;
  birthDate: string | null;
  records: EpisodeVitalRecord[];
  onRecordsChange: (records: EpisodeVitalRecord[]) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

const TREND_FIELDS = [
  "pas",
  "fc",
  "fr",
  "spo2",
  "temperature",
] as const;

export default function VitalsTab({
  episodeId,
  birthDate,
  records,
  onRecordsChange,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<VitalRecordInput>({
    o2_type: "ar_ambiente",
    care_location: "enfermaria",
    central_venous_access: false,
    iot: false,
    monitoring: false,
  });

  const ultimoVital = useMemo(() => pickUltimoVital(records), [records]);
  const ultimoDispositivo = useMemo(
    () => pickUltimoComDispositivo(records),
    [records],
  );

  const saveRecord = useCallback(async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/pacientes/episodios/${episodeId}/vitais`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }
    onRecordsChange([data.record, ...records]);
    setForm({
      o2_type: "ar_ambiente",
      care_location: "enfermaria",
      central_venous_access: false,
      iot: false,
      monitoring: false,
    });
  }, [episodeId, form, onRecordsChange, records]);

  const latestAlerts = ultimoVital
    ? getVitalAlertsForRecord(ultimoVital, birthDate)
    : [];
  const criticalAlerts = getCriticalVitalAlerts(ultimoVital);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-navy-900/8 bg-navy-50/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-800/55">
            Último sinal vital
          </p>
          <p className="mt-2 text-sm text-navy-950">{summarizeVitals(ultimoVital)}</p>
          {latestAlerts.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              {latestAlerts.map((a) => (
                <li key={a.field}>⚠ {a.message}</li>
              ))}
            </ul>
          )}
          {criticalAlerts.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs font-medium text-red-700">
              {criticalAlerts.map((a) => (
                <li key={a.field}>🔴 {a.message}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-navy-900/8 bg-navy-50/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-800/55">
            Último dispositivo
          </p>
          <p className="mt-2 text-sm text-navy-950">
            {summarizeDevices(ultimoDispositivo)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TREND_FIELDS.map((field) => (
          <VitalTrendChart
            key={field}
            field={field}
            records={records}
            birthDate={birthDate}
          />
        ))}
      </div>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy-950">Novo registro</h3>
        <p className="mt-1 text-xs text-navy-800/60">
          Preencha ao menos um sinal vital ou dispositivo (além de ar ambiente /
          enfermaria).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["pas", "PAS (mmHg)"],
              ["pad", "PAD (mmHg)"],
              ["fc", "FC (bpm)"],
              ["fr", "FR (irpm)"],
              ["spo2", "SpO₂ (%)"],
              ["temperature", "Temperatura (°C)"],
              ["glasgow", "Glasgow"],
              ["diurese_ml", "Diurese (mL)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-navy-800/70">
              {label}
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={form[key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    [key]: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs text-navy-800/70">
            Tipo de O₂
            <select
              className={`${inputClass} mt-1`}
              value={form.o2_type ?? "ar_ambiente"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  o2_type: e.target.value as O2Type,
                }))
              }
            >
              {(Object.keys(O2_TYPE_LABELS) as O2Type[]).map((k) => (
                <option key={k} value={k}>
                  {O2_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-navy-800/70">
            Fluxo (L/min)
            <input
              type="number"
              step="0.5"
              className={`${inputClass} mt-1`}
              value={form.o2_flow_lmin ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  o2_flow_lmin:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block text-xs text-navy-800/70">
            Local
            <select
              className={`${inputClass} mt-1`}
              value={form.care_location ?? "enfermaria"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  care_location: e.target.value as CareLocation,
                }))
              }
            >
              {(Object.keys(CARE_LOCATION_LABELS) as CareLocation[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {CARE_LOCATION_LABELS[k]}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-navy-900">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.central_venous_access ?? false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  central_venous_access: e.target.checked,
                }))
              }
            />
            Acesso venoso central
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.iot ?? false}
              onChange={(e) =>
                setForm((f) => ({ ...f, iot: e.target.checked }))
              }
            />
            IOT
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.monitoring ?? false}
              onChange={(e) =>
                setForm((f) => ({ ...f, monitoring: e.target.checked }))
              }
            />
            Monitorização
          </label>
        </div>

        <label className="mt-3 block text-xs text-navy-800/70">
          Observação
          <textarea
            className={`${inputClass} mt-1 min-h-[72px]`}
            value={form.observation ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, observation: e.target.value }))
            }
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={saveRecord}
          className="mt-4 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar registro"}
        </button>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-navy-950">Histórico</h3>
        {records.length === 0 ? (
          <p className="text-sm text-navy-800/60">Nenhum registro ainda.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => {
              const alerts = getVitalAlertsForRecord(r, birthDate);
              return (
                <li
                  key={r.id}
                  className="rounded-md border border-navy-900/8 bg-white px-4 py-3 text-sm"
                >
                  <p className="text-xs text-navy-800/55">
                    {new Date(r.recorded_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-navy-950">{summarizeVitals(r)}</p>
                  <p className="mt-1 text-xs text-navy-800/70">
                    {summarizeDevices(r)}
                  </p>
                  {r.observation?.trim() && (
                    <p className="mt-1 text-xs text-navy-800/80">
                      {r.observation}
                    </p>
                  )}
                  {alerts.length > 0 && (
                    <ul className="mt-2 text-xs text-amber-800">
                      {alerts.map((a) => (
                        <li key={a.field}>{a.message}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
