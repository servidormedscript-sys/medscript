"use client";

import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const RASS_TARGETS = [
  { value: "-2", label: "RASS -2 (desperta ao nome)" },
  { value: "-3", label: "RASS -3 (movimento/voz)" },
  { value: "-4", label: "RASS -4 (resposta mínima)" },
];

export default function SedacaoProtocol() {
  const [rass, setRass] = useState("-2");

  return (
    <ProtocolCalcAssist
      protocolId="sedacao"
      examItems={["RASS a cada 4 h ou titulação", "BIS opcional", "Delirium (CAM-ICU) diário"]}
    >
      <ProtocolPanel title="Alvo de sedação (VM)">
        <select
          value={rass}
          onChange={(e) => setRass(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          {RASS_TARGETS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-navy-800/60">Analgosedação: analgesia antes de aumentar sedativo.</p>
      </ProtocolPanel>
    </ProtocolCalcAssist>
  );
}
