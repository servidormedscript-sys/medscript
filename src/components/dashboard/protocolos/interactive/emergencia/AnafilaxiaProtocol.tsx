"use client";

import { useEffect, useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, DangerBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AnafilaxiaProtocol() {
  const [dosesIm, setDosesIm] = useState(0);
  const [lastDoseAt, setLastDoseAt] = useState<number | null>(null);
  const [minutesSince, setMinutesSince] = useState(0);
  const [flags, setFlags] = useState({ dispneia: false, hipotensao: false, estridor: false });

  useEffect(() => {
    if (!lastDoseAt) return;
    const t = setInterval(() => {
      setMinutesSince(Math.floor((Date.now() - lastDoseAt) / 60000));
    }, 1000);
    return () => clearInterval(t);
  }, [lastDoseAt]);

  function registerAdrenalina() {
    setDosesIm((c) => c + 1);
    setLastDoseAt(Date.now());
    setMinutesSince(0);
  }

  const unstable = flags.dispneia || flags.hipotensao || flags.estridor;

  return (
    <ProtocolCalcAssist
      protocolId="anafilaxia"
      examItems={[
        "Monitorizar PA, FC, SpO₂ contínuo",
        "Acesso venoso calibroso",
        "Considerar observação 4–6 h (bifásica)",
      ]}
    >
      {unstable && (
        <DangerBanner title="Anafilaxia com instabilidade — adrenalina IM imediata">
          Repetir IM a cada 5–15 min se persistência; preparar infusão e UTI.
        </DangerBanner>
      )}
      <ProtocolPanel title="Critérios clínicos">
        <CheckboxField label="Dispneia / sibilos" checked={flags.dispneia} onChange={(v) => setFlags((p) => ({ ...p, dispneia: v }))} />
        <CheckboxField label="Hipotensão / síncope" checked={flags.hipotensao} onChange={(v) => setFlags((p) => ({ ...p, hipotensao: v }))} />
        <CheckboxField label="Estridor / edema de língua" checked={flags.estridor} onChange={(v) => setFlags((p) => ({ ...p, estridor: v }))} />
      </ProtocolPanel>
      <ProtocolPanel title="Adrenalina IM">
        <p className="text-sm">Doses registradas: {dosesIm}</p>
        {lastDoseAt && (
          <p className="text-sm text-navy-800/70">
            Última dose há {minutesSince} min — considerar repetir se ≥5 min e sintomas persistem.
          </p>
        )}
        <button
          type="button"
          onClick={registerAdrenalina}
          className="mt-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Registrar adrenalina IM
        </button>
      </ProtocolPanel>
    </ProtocolCalcAssist>
  );
}
