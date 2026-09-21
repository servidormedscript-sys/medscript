"use client";

import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function DpocProtocol() {
  const [severe, setSevere] = useState({ silent: false, cianose: false, confusao: false });

  return (
    <ProtocolCalcAssist
      protocolId="dpoc"
      examItems={["Gasometria se dispneia importante", "Rx tórax", "ECG se dor torácica"]}
    >
      <ProtocolPanel title="Gravidade">
        <CheckboxField label="Tórax silencioso / fadiga" checked={severe.silent} onChange={(v) => setSevere((p) => ({ ...p, silent: v }))} />
        <CheckboxField label="Cianose / SpO₂ persistente baixa" checked={severe.cianose} onChange={(v) => setSevere((p) => ({ ...p, cianose: v }))} />
        <CheckboxField label="Confusão / sonolência" checked={severe.confusao} onChange={(v) => setSevere((p) => ({ ...p, confusao: v }))} />
        {(severe.silent || severe.cianose || severe.confusao) && (
          <p className="mt-2 text-sm font-medium text-red-800">Considerar VNI ou IOT — UTI.</p>
        )}
      </ProtocolPanel>
      <ProtocolPanel title="Condutas">
        <ul className="list-inside list-disc text-sm text-navy-800/85">
          <li>Broncodilatador curto de ação repetido + ipratrópio.</li>
          <li>Corticoide sistêmico 5 dias.</li>
          <li>Antibiótico se suspeita de infecção bacteriana sobreposta.</li>
        </ul>
      </ProtocolPanel>
    </ProtocolCalcAssist>
  );
}
