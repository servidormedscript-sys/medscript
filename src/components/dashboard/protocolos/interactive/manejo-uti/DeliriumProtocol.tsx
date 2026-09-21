"use client";

import Link from "next/link";
import { useState } from "react";
import {
  alertaAgitacaoGrave,
  camAvaliavel,
  camPositivo,
  caracteristica4AlteracaoConsciencia,
  RASS_COMPLETO,
  subtipoDelirium,
  type RassCompleto,
} from "@/lib/clinical/protocols/interactive/manejo-uti/delirium/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function DeliriumProtocol() {
  const [rass, setRass] = useState<RassCompleto>(null);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const avaliavel = camAvaliavel(rass);
  const c4 = caracteristica4AlteracaoConsciencia(rass);
  const positivo = avaliavel && camPositivo(c1, c2, c3, c4);
  const subtipo = subtipoDelirium(rass, positivo);
  const agitacao = alertaAgitacaoGrave(rass);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="RASS completo">
        <select
          value={rass ?? ""}
          onChange={(e) => setRass(e.target.value === "" ? null : (Number(e.target.value) as RassCompleto))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Selecionar…</option>
          {RASS_COMPLETO.map((o) => (
            <option key={String(o.value)} value={o.value ?? ""}>
              {o.label}
            </option>
          ))}
        </select>
      </ProtocolPanel>

      {!avaliavel && rass !== null && (
        <InfoBanner>CAM-ICU não avaliável (RASS ≤-4). Reavaliar quando RASS &gt; -4.</InfoBanner>
      )}

      {avaliavel && (
        <ProtocolPanel title="CAM-ICU">
          <CheckboxField
            label="1. Início agudo / curso flutuante"
            checked={c1}
            onChange={setC1}
          />
          <CheckboxField
            label="2. Inatenção (ASE &lt;8 acertos)"
            checked={c2}
            onChange={setC2}
            description="Registrar manualmente após teste"
          />
          <CheckboxField
            label="3. Pensamento desorganizado (≥3 erros ou não seguiu 2 comandos)"
            checked={c3}
            onChange={setC3}
          />
          <p className="mt-2 text-sm">
            4. Alteração nível de consciência (automático):{" "}
            <strong>{c4 ? "Sim (RASS ≠ 0)" : "Não (RASS = 0)"}</strong>
          </p>
          <p className="mt-3 font-semibold">
            CAM-ICU: {positivo ? "POSITIVO" : "negativo"}
            {positivo && subtipo ? ` — subtipo ${subtipo}` : ""}
          </p>
        </ProtocolPanel>
      )}

      {positivo && (
        <ProtocolPanel title="Manejo (PADIS 2018)">
          <ul className="list-inside list-disc text-sm space-y-1">
            <li>Medidas não farmacológicas em 1ª linha</li>
            <li>Evitar benzodiazepínico (exceto abstinência álcool)</li>
            <li>Antipsicótico só se agitação grave refratária (ex.: haloperidol dose baixa)</li>
          </ul>
        </ProtocolPanel>
      )}

      {agitacao && (
        <DangerBanner title="RASS ≥3 — agitação grave associada">
          <Link href="/dashboard/protocolos-clinicos?category=saude-mental&protocol=agitacao" className="text-red-800 underline">
            Agitação psicomotora
          </Link>
        </DangerBanner>
      )}
    </div>
  );
}
