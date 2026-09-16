"use client";

type PatientParamsFormProps = {
  weightKg: string;
  ageYears: string;
  ageMonths: string;
  onWeightChange: (value: string) => void;
  onAgeYearsChange: (value: string) => void;
  onAgeMonthsChange: (value: string) => void;
};

export default function PatientParamsForm({
  weightKg,
  ageYears,
  ageMonths,
  onWeightChange,
  onAgeYearsChange,
  onAgeMonthsChange,
}: PatientParamsFormProps) {
  return (
    <section className="rounded-lg border border-navy-900/10 bg-white p-5">
      <h3 className="mb-1 text-sm font-medium text-navy-950">
        Dados do paciente
      </h3>
      <p className="mb-4 text-xs text-navy-800/60">
        Informe peso e idade para calcular as doses automaticamente.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-navy-800/70">
            Peso (kg)
          </span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weightKg}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder="Ex: 70"
            className="w-full rounded-md border border-navy-900/12 px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-navy-800/70">
            Idade (anos)
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={ageYears}
            onChange={(e) => onAgeYearsChange(e.target.value)}
            placeholder="Ex: 45"
            className="w-full rounded-md border border-navy-900/12 px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-navy-800/70">
            Meses
          </span>
          <input
            type="number"
            min="0"
            max="11"
            step="1"
            value={ageMonths}
            onChange={(e) => onAgeMonthsChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-md border border-navy-900/12 px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700"
          />
        </label>
      </div>
    </section>
  );
}
