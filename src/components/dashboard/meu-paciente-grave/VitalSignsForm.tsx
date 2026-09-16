"use client";

import type { VitalSigns } from "@/lib/types/clinical-assessment";
import { TEC_LABELS } from "@/lib/types/clinical-assessment";
import { detectFever } from "@/lib/clinical/suggestion-rules";
import { T0SectionIcon } from "@/lib/clinical/t0-section-icons";

type VitalSignsFormProps = {
  values: VitalSigns;
  onChange: (values: VitalSigns) => void;
  readOnly?: boolean;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700 disabled:cursor-default disabled:bg-navy-50/60";

export default function VitalSignsForm({
  values,
  onChange,
  readOnly = false,
}: VitalSignsFormProps) {
  const hasFever = detectFever(values.temperature);

  function set(field: keyof VitalSigns, value: string) {
    onChange({ ...values, [field]: value });
  }

  return (
    <section className="rounded-lg border border-navy-900/8 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <T0SectionIcon sectionId="vital_signs" />
        <h3 className="text-sm font-medium text-navy-950">Sinais vitais</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            Temperatura (°C)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="36.5"
            value={values.temperature}
            onChange={(e) => set("temperature", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={`${inputClass}${hasFever ? " border-red-400 bg-red-50" : ""}`}
          />
          {hasFever && (
            <p className="mt-1 text-xs font-medium text-red-700">
              Febre detectada (≥ 37,8°C)
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            FC (bpm)
          </label>
          <input
            type="number"
            value={values.heart_rate}
            onChange={(e) => set("heart_rate", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            FR (irpm)
          </label>
          <input
            type="number"
            value={values.respiratory_rate}
            onChange={(e) => set("respiratory_rate", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            PAS (mmHg)
          </label>
          <input
            type="number"
            value={values.systolic_bp}
            onChange={(e) => set("systolic_bp", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            SpO₂ (%)
          </label>
          <input
            type="number"
            value={values.spo2}
            onChange={(e) => set("spo2", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            Peso (kg, opcional)
          </label>
          <input
            type="number"
            step="0.1"
            value={values.weight}
            onChange={(e) => set("weight", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            TEC (enchimento capilar)
          </label>
          <select
            value={values.tec}
            onChange={(e) => set("tec", e.target.value)}
            disabled={readOnly}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {(Object.keys(TEC_LABELS) as (keyof typeof TEC_LABELS)[]).map(
              (key) => (
                <option key={key} value={key}>
                  {TEC_LABELS[key]}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy-800/70">
            Glicemia (mg/dL, opcional)
          </label>
          <input
            type="number"
            value={values.blood_glucose}
            onChange={(e) => set("blood_glucose", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}
