"use client";

import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";

export default function MeningiteProtocol() {
  return (
    <ProtocolCalcAssist
      protocolId="meningite"
      examItems={[
        "Hemoculturas antes do ATB (se possível)",
        "Punção lombar / neuroimagem se contraindicação",
        "PCR LCR + bioquímica + Gram",
        "Contato profilático conforme agente",
      ]}
    />
  );
}
