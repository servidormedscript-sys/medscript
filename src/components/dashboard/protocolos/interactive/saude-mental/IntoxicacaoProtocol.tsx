"use client";

import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const ANTIDOTOS = [
  { id: "opioides", label: "Opioides → naloxona titulada" },
  { id: "bzds", label: "Benzodiazepínicos → flumazenil (cautela)" },
  { id: "paracetamol", label: "Paracetamol → N-acetilcisteína" },
  { id: "organofos", label: "Organofosforados → atropina + pralidoxima" },
  { id: "cocaina", label: "Cocaína/ simpaticomiméticos → controle PA/ temperatura" },
];

export default function IntoxicacaoProtocol() {
  const [sel, setSel] = useState<Record<string, boolean>>({});

  return (
    <ProtocolCalcAssist
      protocolId="intoxicacao"
      examItems={[
        "Glicemia capilar",
        "ECG (intervalo QT, QRS)",
        "Paracetamol sérico se suspeita",
        "Contato centro de toxicologia",
      ]}
    >
      <ProtocolPanel title="Antídotos / cenários">
        {ANTIDOTOS.map((a) => (
          <CheckboxField
            key={a.id}
            label={a.label}
            checked={sel[a.id] ?? false}
            onChange={(v) => setSel((p) => ({ ...p, [a.id]: v }))}
          />
        ))}
      </ProtocolPanel>
    </ProtocolCalcAssist>
  );
}
