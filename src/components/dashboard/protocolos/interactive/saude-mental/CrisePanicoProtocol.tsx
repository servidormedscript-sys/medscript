"use client";

import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function CrisePanicoProtocol() {
  const [exclude, setExclude] = useState({ dor: false, dispneia: false, glicemia: false });

  return (
    <ProtocolCalcAssist protocolId="crise-panico">
      <ProtocolPanel title="Excluir causa orgânica">
        <CheckboxField label="Dor torácica / SCA descartado" checked={exclude.dor} onChange={(v) => setExclude((p) => ({ ...p, dor: v }))} />
        <CheckboxField label="Dispneia — TEP/asma descartados" checked={exclude.dispneia} onChange={(v) => setExclude((p) => ({ ...p, dispneia: v }))} />
        <CheckboxField label="Glicemia capilar normal" checked={exclude.glicemia} onChange={(v) => setExclude((p) => ({ ...p, glicemia: v }))} />
      </ProtocolPanel>
      <ProtocolPanel title="Manejo não farmacológico">
        <ul className="list-inside list-disc text-sm text-navy-800/85">
          <li>Validação + respiração lenta (4-7-8 ou caixa).</li>
          <li>Evitar reforço de catastrofização.</li>
          <li>Reavaliar em 30–60 min.</li>
        </ul>
      </ProtocolPanel>
    </ProtocolCalcAssist>
  );
}
