"use client";

import Link from "next/link";
import { useState } from "react";
import {
  algumSinalOrganico,
  SINAIS_ORGANICOS,
} from "@/lib/clinical/protocols/interactive/saude-mental/psicose/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function PsicoseProtocol() {
  const [flags, setFlags] = useState(() => SINAIS_ORGANICOS.map(() => false));
  const count = flags.filter(Boolean).length;
  const organico = algumSinalOrganico(flags);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Sinais de alerta orgânico (1º surto / psicose aguda)">
        {SINAIS_ORGANICOS.map((label, i) => (
          <CheckboxField
            key={label}
            label={label}
            checked={flags[i]}
            onChange={(v) => {
              const n = [...flags];
              n[i] = v;
              setFlags(n);
            }}
          />
        ))}
        <p className="mt-2 text-sm">Marcados: {count}/11</p>
      </ProtocolPanel>

      {organico ? (
        <DangerBanner title="Investigar causa orgânica">
          Glicemia, eletrólitos, função hepática/renal, TSH, neuroimagem; considerar encefalite autoimune.
          <Link
            href="/dashboard/protocolos-clinicos?category=clinica-aguda&protocol=rebaixamento-consciencia"
            className="mt-2 block text-sm font-semibold text-red-800 underline"
          >
            Rebaixamento de consciência
          </Link>
        </DangerBanner>
      ) : (
        <InfoBanner>
          Nenhum sinal orgânico marcado — psicose primária mais provável (ainda excluir causas básicas).
          Antipsicótico: dose inicial conforme protocolo BVS (start low, go slow).
        </InfoBanner>
      )}
    </div>
  );
}
