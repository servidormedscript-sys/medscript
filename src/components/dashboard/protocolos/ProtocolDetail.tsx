"use client";

import { useMemo, useState } from "react";
import { calculateProtocol, hasCalculator } from "@/lib/clinical/protocols/calculators";
import {
  getInteractiveProtocol,
  hasInteractiveProtocol,
} from "@/lib/clinical/protocols/interactive/registry";
import { validatePatientParams } from "@/lib/clinical/protocols/dose-utils";
import type { ClinicalProtocol } from "@/lib/clinical/protocols/types";
import PatientParamsForm from "./PatientParamsForm";
import ProtocolDoseResults from "./ProtocolDoseResults";

type ProtocolDetailProps = {
  protocol: ClinicalProtocol;
};

export default function ProtocolDetail({ protocol }: ProtocolDetailProps) {
  const interactive = hasInteractiveProtocol(protocol.id);
  const InteractiveModule = useMemo(
    () => (interactive ? getInteractiveProtocol(protocol.id) : null),
    [interactive, protocol.id]
  );

  const [weightKg, setWeightKg] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("0");

  const calculatorAvailable =
    hasCalculator(protocol.id) && !interactive;

  const { result, error } = useMemo(() => {
    if (!calculatorAvailable) {
      return { result: null, error: null };
    }

    if (!weightKg || ageYears === "") {
      return { result: null, error: null };
    }

    const weight = Number(weightKg);
    const years = Number(ageYears);
    const months = Number(ageMonths || "0");
    const validationError = validatePatientParams(weight, years, months);

    if (validationError) {
      return { result: null, error: validationError };
    }

    const calculated = calculateProtocol(protocol.id, {
      weightKg: weight,
      ageYears: years,
      ageMonths: months,
    });

    return { result: calculated, error: null };
  }, [protocol.id, calculatorAvailable, weightKg, ageYears, ageMonths]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-navy-900/10 bg-white p-5">
        <h2 className="text-xl font-medium text-navy-950">{protocol.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy-800/70">
          {protocol.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {protocol.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-navy-50 px-2.5 py-1 text-xs text-navy-800/70"
            >
              {keyword}
            </span>
          ))}
        </div>
        {interactive ? (
          <p className="mt-4 rounded-lg bg-ocean-50 px-3 py-2 text-xs text-ocean-900">
            Modo assistencial completo: cronômetros, ritmo, condutas e causas reversíveis.
          </p>
        ) : null}
      </section>

      {InteractiveModule ? <InteractiveModule /> : null}

      {calculatorAvailable ? (
        <>
          <PatientParamsForm
            weightKg={weightKg}
            ageYears={ageYears}
            ageMonths={ageMonths}
            onWeightChange={setWeightKg}
            onAgeYearsChange={setAgeYears}
            onAgeMonthsChange={setAgeMonths}
          />
          <ProtocolDoseResults result={result} error={error} />
        </>
      ) : null}

      {!interactive && !calculatorAvailable ? (
        <div className="rounded-lg border border-dashed border-navy-900/15 bg-white p-8 text-center">
          <p className="text-sm text-navy-800/65">
            Este protocolo ainda não possui calculadora automática de doses.
            Em breve será adicionado o conteúdo assistencial completo.
          </p>
        </div>
      ) : null}
    </div>
  );
}
