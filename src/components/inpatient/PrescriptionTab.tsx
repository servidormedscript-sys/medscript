"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getClinicalRulesMeta,
  matchPrescriptionDiagnosisRules,
  medsForRule,
  type PrescriptionRuleMed,
} from "@/lib/clinical-rules/prescription-diagnosis";
import {
  findActiveAllergyConflicts,
  medicationConflictsAllergy,
} from "@/lib/inpatient/allergy-check";
import {
  DIET_OPTIONS,
  GENERAL_ORDER_ITEMS,
  CAPRINI_ITEMS,
  PADUA_ITEMS,
  paduaHighRisk,
  scoreCaprini,
  scorePadua,
  suggestCombinedTevProphylaxis,
  VITALS_FREQUENCY_OPTIONS,
} from "@/lib/inpatient/general-orders";
import { parseWeightKg } from "@/lib/inpatient/parse-weight";
import { calculatePediatricDoses } from "@/lib/inpatient/pediatric-dose-calculator";
import {
  activePrescriptions,
  formatPrescriptionLine,
  suspendedPrescriptions,
} from "@/lib/inpatient/prescription-format";
import type {
  EpisodeGeneralOrders,
  EpisodeMedReconciliation,
  EpisodePrescription,
  PrescriptionInput,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";
import PrescriptionPrintSheet from "./PrescriptionPrintSheet";

type Props = {
  episodeId: string;
  episode: PatientEpisode;
  patient: Patient;
  prescriptions: EpisodePrescription[];
  reconciliation: EpisodeMedReconciliation[];
  generalOrders: EpisodeGeneralOrders;
  onPrescriptionsChange: (list: EpisodePrescription[]) => void;
  onReconciliationChange: (list: EpisodeMedReconciliation[]) => void;
  onGeneralOrdersChange: (orders: EpisodeGeneralOrders) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

const HOURS = [
  "02h",
  "04h",
  "06h",
  "08h",
  "10h",
  "12h",
  "14h",
  "16h",
  "18h",
  "20h",
  "22h",
  "24h",
];

export default function PrescriptionTab({
  episodeId,
  episode,
  patient,
  prescriptions,
  reconciliation,
  generalOrders,
  onPrescriptionsChange,
  onReconciliationChange,
  onGeneralOrdersChange,
}: Props) {
  const [form, setForm] = useState<PrescriptionInput>({
    name: "",
    dose: "",
    route: "EV",
    frequency: "",
    indication: "",
    duration_days: 7,
    use_continuous: false,
  });
  const [saving, setSaving] = useState(false);
  const [allergyToast, setAllergyToast] = useState<string | null>(null);
  const [calcWeight, setCalcWeight] = useState(
    () => String(parseWeightKg(episode.weight) ?? ""),
  );

  const weightKg = parseWeightKg(episode.weight);
  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const rulesMeta = getClinicalRulesMeta();

  const nameAllergyHits = useMemo(
    () => medicationConflictsAllergy(form.name, episode.allergies),
    [form.name, episode.allergies],
  );

  const activeConflicts = useMemo(
    () =>
      findActiveAllergyConflicts(
        episode.allergies,
        activePrescriptions(prescriptions).map((r) => r.name),
      ),
    [episode.allergies, prescriptions],
  );

  const diagnosisRules = useMemo(
    () => matchPrescriptionDiagnosisRules(episode.diagnosis, weightKg),
    [episode.diagnosis, weightKg],
  );

  const pedDoses = useMemo(() => {
    const w = parseFloat(calcWeight.replace(",", "."));
    return calculatePediatricDoses(w);
  }, [calcWeight]);

  const reconPending = reconciliation.filter((r) => r.status === "pendente");
  const reconDone = reconciliation.length > 0 && reconPending.length === 0;

  const paduaTotal = scorePadua(generalOrders.padua_score);
  const capriniTotal = scoreCaprini(generalOrders.caprini_score);
  const tevSuggestion = suggestCombinedTevProphylaxis({
    padua: generalOrders.padua_score,
    caprini: generalOrders.caprini_score,
    ageYears: age?.years ?? null,
    weightKg,
    sexFemale: patient.sex === "feminino",
  });

  const addPrescription = useCallback(
    async (input: PrescriptionInput, skipAllergyToast = false) => {
      const hits = medicationConflictsAllergy(input.name, episode.allergies);
      if (hits.length && !skipAllergyToast) {
        setAllergyToast(
          `Alerta de alergia (${hits.join(", ")}). A prescrição será salva mesmo assim — revise.`,
        );
      }
      setSaving(true);
      const res = await fetch(
        `/api/pacientes/episodios/${episodeId}/prescricao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const data = await res.json();
      setSaving(false);
      if (!res.ok) return false;
      onPrescriptionsChange([data.prescription, ...prescriptions]);
      return true;
    },
    [episodeId, episode.allergies, onPrescriptionsChange, prescriptions],
  );

  async function submitForm() {
    if (!form.name?.trim()) return;
    const ok = await addPrescription(form);
    if (ok) {
      setForm({
        name: "",
        dose: "",
        route: "EV",
        frequency: "",
        indication: "",
        duration_days: 7,
        use_continuous: false,
      });
    }
  }

  async function addFromRule(med: PrescriptionRuleMed) {
    await addPrescription({
      name: med.name,
      dose: med.dose,
      route: med.route,
      frequency: med.frequency,
      indication: med.indication,
      duration_days: med.durationDays ?? null,
      use_continuous: med.useContinuous ?? false,
    });
  }

  async function suspendRx(id: string) {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/prescricao/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspender" }),
      },
    );
    const data = await res.json();
    if (!res.ok) return;
    onPrescriptionsChange(
      prescriptions.map((r) =>
        r.id === id ? data.prescription : r,
      ),
    );
  }

  async function decideRecon(id: string, action: "manter" | "suspender") {
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/reconciliacao`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      },
    );
    const data = await res.json();
    if (!res.ok) return;
    onReconciliationChange(
      reconciliation.map((r) => (r.id === id ? data.item : r)),
    );
    if (action === "manter") {
      const pr = await fetch(
        `/api/pacientes/episodios/${episodeId}/prescricao`,
      );
      const prData = await pr.json();
      if (pr.ok) onPrescriptionsChange(prData.prescriptions ?? []);
    }
  }

  async function saveGeneralOrders(
    patch: Partial<EpisodeGeneralOrders>,
  ) {
    const next = { ...generalOrders, ...patch };
    const res = await fetch(
      `/api/pacientes/episodios/${episodeId}/ordens-gerais`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_flags: next.order_flags,
          diet: next.diet,
          vitals_frequency: next.vitals_frequency,
          padua_score: next.padua_score,
        }),
      },
    );
    const data = await res.json();
    if (res.ok) onGeneralOrdersChange(data.generalOrders);
  }

  const active = activePrescriptions(prescriptions);
  const suspended = suspendedPrescriptions(prescriptions);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-red-200 bg-red-50/60 p-4">
        <h3 className="text-sm font-semibold text-red-950">Alergias</h3>
        <p className="mt-1 text-sm text-red-900">
          {episode.allergies?.trim() || "Nenhuma alergia registrada na ficha."}
        </p>
        {activeConflicts.length > 0 && (
          <ul className="mt-2 text-xs text-red-800">
            {activeConflicts.map((c) => (
              <li key={c.medication}>
                ⚠ {c.medication} — possível conflito com: {c.substances.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">Ordens gerais</h3>
        <ul className="mt-3 space-y-2">
          {GENERAL_ORDER_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex gap-2 text-sm text-navy-900">
                <input
                  type="checkbox"
                  checked={Boolean(generalOrders.order_flags[item.id])}
                  onChange={(e) =>
                    saveGeneralOrders({
                      order_flags: {
                        ...generalOrders.order_flags,
                        [item.id]: e.target.checked,
                      },
                    })
                  }
                />
                {item.text}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-navy-800/70">
            Dieta
            <select
              className={`${inputClass} mt-1`}
              value={generalOrders.diet}
              onChange={(e) => saveGeneralOrders({ diet: e.target.value })}
            >
              {DIET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-navy-800/70">
            Sinais vitais
            <select
              className={`${inputClass} mt-1`}
              value={generalOrders.vitals_frequency}
              onChange={(e) =>
                saveGeneralOrders({ vitals_frequency: e.target.value })
              }
            >
              {VITALS_FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-navy-950">
            Reconciliação medicamentosa
          </h3>
          {reconDone && (
            <span className="text-xs font-medium text-emerald-800">
              ✅ Reconciliação concluída
            </span>
          )}
        </div>
        {reconciliation.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/60">
            Nenhuma medicação de casa na admissão.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reconciliation.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-navy-900/8 px-3 py-2 text-sm"
              >
                <span>{item.medication_text}</span>
                {item.status === "pendente" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-navy-900/12 px-2 py-1 text-xs"
                      onClick={() => decideRecon(item.id, "manter")}
                    >
                      Manter
                    </button>
                    <button
                      type="button"
                      className="rounded border border-navy-900/12 px-2 py-1 text-xs"
                      onClick={() => decideRecon(item.id, "suspender")}
                    >
                      Suspender
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-navy-800/55">{item.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy-950">Nova medicação</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-navy-800/70 sm:col-span-2">
            Nome *
            <input
              className={`${inputClass} mt-1`}
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            {nameAllergyHits.length > 0 && (
              <span className="mt-1 block text-xs text-amber-800">
                ⚠ Possível alergia: {nameAllergyHits.join(", ")}
              </span>
            )}
          </label>
          <label className="text-xs text-navy-800/70">
            Dose
            <input
              className={`${inputClass} mt-1`}
              value={form.dose}
              onChange={(e) =>
                setForm((f) => ({ ...f, dose: e.target.value }))
              }
            />
          </label>
          <label className="text-xs text-navy-800/70">
            Via
            <input
              className={`${inputClass} mt-1`}
              value={form.route}
              onChange={(e) =>
                setForm((f) => ({ ...f, route: e.target.value }))
              }
            />
          </label>
          <label className="text-xs text-navy-800/70">
            Frequência
            <input
              className={`${inputClass} mt-1`}
              value={form.frequency}
              onChange={(e) =>
                setForm((f) => ({ ...f, frequency: e.target.value }))
              }
            />
          </label>
          <label className="text-xs text-navy-800/70">
            Indicação
            <input
              className={`${inputClass} mt-1`}
              value={form.indication}
              onChange={(e) =>
                setForm((f) => ({ ...f, indication: e.target.value }))
              }
            />
          </label>
          <label className="text-xs text-navy-800/70">
            Duração (dias)
            <input
              type="number"
              className={`${inputClass} mt-1`}
              disabled={form.use_continuous}
              value={form.duration_days ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  duration_days:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.use_continuous}
            onChange={(e) =>
              setForm((f) => ({ ...f, use_continuous: e.target.checked }))
            }
          />
          Uso contínuo
        </label>
        {allergyToast && (
          <p className="mt-2 text-sm text-amber-900" role="status">
            {allergyToast}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={submitForm}
          className="mt-4 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Adicionar à prescrição"}
        </button>
      </section>

      {diagnosisRules.length > 0 && (
        <section className="rounded-lg border border-ocean-200 bg-ocean-50/50 p-4">
          <h3 className="text-sm font-semibold text-navy-950">
            Sugestão por diagnóstico
          </h3>
          <p className="text-[11px] text-navy-800/50">
            Regras {rulesMeta.version} — revise antes de usar.
          </p>
          {diagnosisRules.map((rule) => (
            <div key={rule.id} className="mt-3">
              <p className="text-sm font-medium text-navy-900">{rule.label}</p>
              <p className="text-xs text-navy-800/55">{rule.fonte}</p>
              <ul className="mt-2 space-y-2">
                {medsForRule(rule, weightKg).map((med) => (
                  <li
                    key={`${rule.id}-${med.name}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {med.name} {med.dose} {med.route} {med.frequency}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => addFromRule(med)}
                      className="rounded border border-navy-900/15 px-2 py-1 text-xs font-medium hover:bg-white"
                    >
                      Adicionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">
          Calculadora pediátrica avulsa
        </h3>
        <label className="mt-2 block text-xs text-navy-800/70">
          Peso (kg)
          <input
            className={`${inputClass} mt-1 max-w-[8rem]`}
            value={calcWeight}
            onChange={(e) => setCalcWeight(e.target.value)}
          />
        </label>
        {pedDoses.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-navy-900">
            {pedDoses.map((d) => (
              <li key={d.id}>
                <strong>{d.label}:</strong> {d.result}
                {d.note ? ` — ${d.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">
          Profilaxia de TEV — Padua
        </h3>
        <p className="text-xs text-navy-800/55">
          Pontuação: {paduaTotal}{" "}
          {paduaHighRisk(generalOrders.padua_score) ? "(alto risco ≥4)" : ""}
        </p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {PADUA_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex gap-2 text-xs text-navy-900">
                <input
                  type="checkbox"
                  checked={Boolean(generalOrders.padua_score[item.id])}
                  onChange={(e) =>
                    saveGeneralOrders({
                      padua_score: {
                        ...generalOrders.padua_score,
                        [item.id]: e.target.checked,
                      },
                    })
                  }
                />
                {item.label} (+{item.points})
              </label>
            </li>
          ))}
        </ul>
        {tevSuggestion && (
          <p className="mt-3 text-sm text-navy-800">{tevSuggestion}</p>
        )}
      </section>

      <section className="rounded-lg border border-navy-900/8 bg-white p-4">
        <h3 className="text-sm font-semibold text-navy-950">
          Profilaxia de TEV — Caprini (cirúrgico)
        </h3>
        <p className="text-xs text-navy-800/55">
          Pontuação: {capriniTotal}
        </p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {CAPRINI_ITEMS.map((item) => (
            <li key={item.id}>
              <label className="flex gap-2 text-xs text-navy-900">
                <input
                  type="checkbox"
                  checked={Boolean(generalOrders.caprini_score[item.id])}
                  onChange={(e) =>
                    saveGeneralOrders({
                      caprini_score: {
                        ...generalOrders.caprini_score,
                        [item.id]: e.target.checked,
                      },
                    })
                  }
                />
                {item.label} (+{item.points})
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-navy-950">
          Medicações ativas
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-navy-800/60">Nenhuma.</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {active.map((rx) => (
              <li key={rx.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{formatPrescriptionLine(rx)}</span>
                <button
                  type="button"
                  onClick={() => suspendRx(rx.id)}
                  className="text-xs text-red-700 underline"
                >
                  Suspender
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {suspended.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-navy-950">
            Suspensas
          </h3>
          <ul className="space-y-1 text-sm text-navy-800/70">
            {suspended.map((rx) => (
              <li key={rx.id}>{formatPrescriptionLine(rx)}</li>
            ))}
          </ul>
        </section>
      )}

      <PrescriptionPrintSheet
        patientName={patient.full_name}
        episode={episode}
        generalOrders={generalOrders}
        activePrescriptions={active}
        hours={HOURS}
      />
    </div>
  );
}
