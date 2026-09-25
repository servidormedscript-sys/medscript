"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AbdomeAgudoProtocol() {
  const [flags, setFlags] = useState({
    defesa: false,
    ictericia: false,
    sangramento: false,
    gravidez: false,
  });

  const cirurgico =
    flags.defesa || flags.ictericia || (flags.sangramento && flags.defesa);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Sinais de gravidade">
        {(
          [
            ["Defesa / abdome em tábua", "defesa"],
            ["Icterícia obstrutiva suspeita", "ictericia"],
            ["Sangramento digestivo", "sangramento"],
            ["Gravidez / possível gestação ectópica", "gravidez"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={flags[key]}
            onChange={(v) => setFlags((p) => ({ ...p, [key]: v }))}
          />
        ))}
      </ProtocolPanel>

      {cirurgico && (
        <DangerBanner title="Priorizar avaliação cirúrgica / imagem urgente">
          NPO, acesso venoso, analgesia cautelosa, considerar laparotomia conforme cenário.
        </DangerBanner>
      )}

      {flags.sangramento && (
        <InfoBanner>
          <Link href="/dashboard/protocolos-clinicos?category=clinica-aguda&protocol=hda" className="font-semibold underline">
            Hemorragia digestiva alta
          </Link>
        </InfoBanner>
      )}

      <ProtocolPanel title="Condutas iniciais">
        <ul className="list-inside list-disc space-y-1 text-sm text-navy-800/85">
          <li>Monitorização, balanço hídrico, laboratório (hemograma, lactato, função hepática/pancreática conforme quadro).</li>
          <li>Imagem: USG à beira-leito ou TC conforme estabilidade e suspeita.</li>
          <li>Analgesia e antiemético; evitar mascarar peritonite.</li>
          <li>Antibioticoterapia se suspeita de infecção intra-abdominal.</li>
        </ul>
      </ProtocolPanel>
    </div>
  );
}
