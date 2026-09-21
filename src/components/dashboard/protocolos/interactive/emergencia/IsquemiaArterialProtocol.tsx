"use client";

import { useState } from "react";
import { CheckboxField, DangerBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const SEIS_P = [
  "Pain (dor súbita)",
  "Pallor (palidez)",
  "Pulselessness (pulso ausente)",
  "Paresthesias",
  "Paralysis (paralisia)",
  "Poikilothermia (frio)",
] as const;

export default function IsquemiaArterialProtocol() {
  const [ps, setPs] = useState<Record<string, boolean>>({});

  const count = SEIS_P.filter((_, i) => ps[`p${i}`]).length;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="6 P&apos;s — isquemia arterial aguda">
        {SEIS_P.map((label, i) => (
          <CheckboxField
            key={label}
            label={label}
            checked={ps[`p${i}`] ?? false}
            onChange={(v) => setPs((prev) => ({ ...prev, [`p${i}`]: v }))}
          />
        ))}
        <p className="text-sm">Achados marcados: {count}/6</p>
      </ProtocolPanel>

      {count >= 2 && (
        <DangerBanner title="Emergência vascular — tempo-isquemia">
          Anticoagulação/heparina conforme protocolo institucional; contato imediato com cirurgia vascular;
          evitar aquecimento local; analgesia; não atrasar revascularização.
        </DangerBanner>
      )}

      <ProtocolPanel title="Exames">
        <ul className="list-inside list-disc text-sm text-navy-800/85">
          <li>Doppler arterial / angio-TC conforme disponibilidade.</li>
          <li>Considerar embolia vs trombose in situ.</li>
        </ul>
      </ProtocolPanel>
    </div>
  );
}
