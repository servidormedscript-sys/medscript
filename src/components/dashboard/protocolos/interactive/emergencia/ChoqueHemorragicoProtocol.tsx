"use client";

import Link from "next/link";
import { useState } from "react";
import ProtocolCalcAssist from "@/components/dashboard/protocolos/interactive/shared/ProtocolCalcAssist";
import { CheckboxField, DangerBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function ChoqueHemorragicoProtocol() {
  const [mtp, setMtp] = useState({
    compressao: false,
    acesso: false,
    aquecer: false,
    txa: false,
    mtpAtivo: false,
  });

  return (
    <ProtocolCalcAssist
      protocolId="choque-hemorragico"
      examItems={[
        "Hb/Ht seriado + coagulograma",
        "Tipagem + prova cruzada",
        "Gasometria / lactato",
        "FAST / imagem conforme trauma",
      ]}
    >
      <ProtocolPanel title="Controle da hemorragia (1ª prioridade)">
        {(
          [
            ["Compressão / torniquete / packing", "compressao"],
            ["2 acessos calibrosos + amostras", "acesso"],
            ["Aquecer paciente (transfusão)", "aquecer"],
            ["Ácido tranexâmico ≤3 h do trauma", "txa"],
            ["Protocolo transfusão maciça ativado", "mtpAtivo"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={mtp[key]}
            onChange={(v) => setMtp((p) => ({ ...p, [key]: v }))}
          />
        ))}
      </ProtocolPanel>
      {mtp.mtpAtivo && (
        <DangerBanner title="MTP — proporção 1:1:1 (CH:PFC:Plaquetas)">
          Repor cálcio; reavaliar perfusão e coagulopatia.
        </DangerBanner>
      )}
      <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=trauma-grave" className="text-sm font-semibold text-ocean-800 underline">
        Trauma grave (ABCDE)
      </Link>
    </ProtocolCalcAssist>
  );
}
