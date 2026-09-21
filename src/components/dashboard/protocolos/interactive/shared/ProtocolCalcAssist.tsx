"use client";

import { useMemo, useState } from "react";
import { calculateProtocol } from "@/lib/clinical/protocols/calculators";
import { validatePatientParams } from "@/lib/clinical/protocols/dose-utils";
import PatientParamsForm from "@/components/dashboard/protocolos/PatientParamsForm";
import { CheckboxField, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

type Props = {
  protocolId: string;
  children?: React.ReactNode;
  examsTitle?: string;
  examItems?: string[];
};

export default function ProtocolCalcAssist({
  protocolId,
  children,
  examsTitle = "Exames / monitorização",
  examItems = [],
}: Props) {
  const [weightKg, setWeightKg] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("0");
  const [stepDone, setStepDone] = useState<Record<string, boolean>>({});
  const [examDone, setExamDone] = useState<Record<number, boolean>>({});

  const { result, error } = useMemo(() => {
    if (!weightKg || ageYears === "") return { result: null, error: null };
    const weight = Number(weightKg);
    const years = Number(ageYears);
    const months = Number(ageMonths || "0");
    const validationError = validatePatientParams(weight, years, months);
    if (validationError) return { result: null, error: validationError };
    return {
      result: calculateProtocol(protocolId, {
        weightKg: weight,
        ageYears: years,
        ageMonths: months,
      }),
      error: null,
    };
  }, [protocolId, weightKg, ageYears, ageMonths]);

  return (
    <div className="space-y-4">
      {children}
      <PatientParamsForm
        weightKg={weightKg}
        ageYears={ageYears}
        ageMonths={ageMonths}
        onWeightChange={setWeightKg}
        onAgeYearsChange={setAgeYears}
        onAgeMonthsChange={setAgeMonths}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {result && (
        <>
          {result.steps.map((step) => (
            <ProtocolPanel key={step.title} title={step.title}>
              {step.items.map((item) => {
                const key = `${step.title}::${item}`;
                return (
                  <CheckboxField
                    key={key}
                    label={item}
                    checked={stepDone[key] ?? false}
                    onChange={(v) => setStepDone((p) => ({ ...p, [key]: v }))}
                  />
                );
              })}
            </ProtocolPanel>
          ))}
          <ProtocolPanel title="Doses calculadas">
            <ul className="space-y-2 text-sm">
              {result.doses.map((d) => (
                <li key={`${d.drug}-${d.route}`} className="rounded-lg border border-navy-900/8 bg-navy-50/50 p-3">
                  <p className="font-semibold text-navy-950">
                    {d.drug} — {d.calculatedDose} ({d.route})
                  </p>
                  {d.frequency && <p className="text-xs text-navy-800/70">{d.frequency}</p>}
                  {d.notes && <p className="mt-1 text-xs text-navy-800/60">{d.notes}</p>}
                </li>
              ))}
            </ul>
            {result.warnings.length > 0 && (
              <ul className="mt-3 list-inside list-disc text-xs text-amber-900">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </ProtocolPanel>
        </>
      )}
      {examItems.length > 0 && (
        <ProtocolPanel title={examsTitle}>
          {examItems.map((item, i) => (
            <CheckboxField
              key={item}
              label={item}
              checked={examDone[i] ?? false}
              onChange={(v) => setExamDone((p) => ({ ...p, [i]: v }))}
            />
          ))}
        </ProtocolPanel>
      )}
    </div>
  );
}
