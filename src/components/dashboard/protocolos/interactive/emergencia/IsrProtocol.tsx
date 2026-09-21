"use client";

import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, DangerBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function IsrProtocol() {
  const [prep, setPrep] = useState({
    preox: false,
    aspiracao: false,
    monitor: false,
    dificil: false,
    succContra: false,
  });

  const ready = prep.preox && prep.monitor && prep.aspiracao;

  return (
    <ProtocolCalcAssist
      protocolId="isr"
      examItems={["Capnografia pós-IOT", "Rx tórax controle", "Sedação/analgesia pós-intubação"]}
    >
      <ProtocolPanel title="Checklist pré-intubação">
        {(
          [
            ["Pré-oxigenação 3–5 min (ou apneia desaturação)", "preox"],
            ["Monitor ECG + SpO₂ + capnografia", "monitor"],
            ["Aspiração / material VA difícil à mão", "aspiracao"],
            ["Plano VA difícil (bougie / ML)", "dificil"],
            ["Contraindicação a succinilcolina (hiperK, queimadura)", "succContra"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={prep[key]}
            onChange={(v) => setPrep((p) => ({ ...p, [key]: v }))}
          />
        ))}
      </ProtocolPanel>
      {prep.succContra && (
        <DangerBanner title="Evitar succinilcolina — preferir rocurônio">
          Risco de hipercalemia em situações selecionadas.
        </DangerBanner>
      )}
      {ready && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
          Pré-intubação mínima concluída — prosseguir com sequência rápida.
        </p>
      )}
    </ProtocolCalcAssist>
  );
}
