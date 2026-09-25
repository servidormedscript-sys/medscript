"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PatientParamsForm from "@/components/dashboard/protocolos/PatientParamsForm";
import {
  ACCIDENT_OPTIONS,
  ANTIVENOM_ADMIN,
  type AccidentType,
  ampoulesFor,
  isValidSeverityForType,
  linksFor,
  prednisoneLoxosceles,
  severityOptionsFor,
  showPediatricEscorpionWarning,
  speciesNotes,
  type Severity,
} from "@/lib/clinical/protocols/interactive/emergencia/peconhentos/logic";
import { DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function PeconhentosProtocol() {
  const [accident, setAccident] = useState<AccidentType>("botropico");
  const [severity, setSeverity] = useState<Severity>("leve");
  const [weightKg, setWeightKg] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("0");

  const severityOptions = useMemo(() => severityOptionsFor(accident), [accident]);

  useEffect(() => {
    if (!isValidSeverityForType(accident, severity)) {
      setSeverity(severityOptions[0]?.id ?? "leve");
    }
  }, [accident, severity, severityOptions]);

  const ageN = Number(ageYears) || 0;
  const weightN = Number(weightKg) || 0;
  const amps = ampoulesFor(accident, severity);
  const links = linksFor(accident, severity);
  const pred = accident === "loxosceles"
    ? prednisoneLoxosceles(severity, ageN, weightN)
    : null;
  const escorpionPed = showPediatricEscorpionWarning(accident, ageN);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Tipo de acidente">
        <select
          value={accident}
          onChange={(e) => setAccident(e.target.value as AccidentType)}
          className="w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm"
        >
          {ACCIDENT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </ProtocolPanel>

      <ProtocolPanel title="Grau de gravidade">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity)}
          className="w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm"
        >
          {severityOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {accident === "laquetico" && (
          <p className="mt-2 text-xs text-amber-900">
            Laquético: não há grau leve — sempre exige avaliação para soroterapia.
          </p>
        )}
      </ProtocolPanel>

      <PatientParamsForm
        weightKg={weightKg}
        ageYears={ageYears}
        ageMonths={ageMonths}
        onWeightChange={setWeightKg}
        onAgeYearsChange={setAgeYears}
        onAgeMonthsChange={setAgeMonths}
      />

      {escorpionPed && (
        <DangerBanner title="Escorpionismo pediátrico (&lt; 12 anos)">
          Maior risco de manifestação sistêmica grave — monitorização intensiva e reavaliação
          seriada.
        </DangerBanner>
      )}

      <ProtocolPanel title="Soro antiveneno">
        {amps.antivenomIndicated ? (
          <>
            <p className="text-lg font-semibold text-navy-950">
              {amps.display} ampola(s)
            </p>
            <p className="mt-2 text-sm text-navy-800/80">{ANTIVENOM_ADMIN}</p>
          </>
        ) : (
          <InfoBanner>
            <strong>Soro antiveneno não indicado</strong> para esta combinação espécie/grau
            (0 ampolas).
          </InfoBanner>
        )}
        {pred && (
          <p className="mt-3 text-sm font-medium text-navy-950">
            Adjuvante: {pred}
          </p>
        )}
      </ProtocolPanel>

      {(links.choque || links.eap || links.convulsao) && (
        <ProtocolPanel title="Gravidade — protocolos relacionados">
          <div className="flex flex-wrap gap-2">
            {links.choque && (
              <Link
                href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico"
                className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
              >
                Choque
              </Link>
            )}
            {links.eap && (
              <Link
                href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=edema-pulmao"
                className="rounded-full bg-ocean-700 px-4 py-2 text-xs font-semibold text-white hover:bg-ocean-800"
              >
                Edema agudo de pulmão
              </Link>
            )}
            {links.convulsao && (
              <Link
                href="/dashboard/protocolos-clinicos?category=clinica-aguda&protocol=crise-convulsiva"
                className="rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800"
              >
                Crise convulsiva
              </Link>
            )}
          </div>
        </ProtocolPanel>
      )}

      <ProtocolPanel title="Notas por espécie">
        <ul className="list-disc space-y-1 pl-5 text-sm text-navy-900/85">
          {speciesNotes(accident).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </ProtocolPanel>
    </div>
  );
}
