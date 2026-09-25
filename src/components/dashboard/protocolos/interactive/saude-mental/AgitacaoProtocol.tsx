"use client";

import Link from "next/link";
import { useState } from "react";
import {
  alertaCausaOrganica,
  condutaAgita,
  OPCOES_FARMACO,
  QT_IV_AVISO,
  RASS_OPTIONS,
  type RassAgita,
} from "@/lib/clinical/protocols/interactive/saude-mental/agitacao/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const CONDUTA_LABEL: Record<string, string> = {
  selecionar: "Selecione o nível RASS.",
  sem_agitacao: "Sem agitação significativa (RASS ≤0).",
  desescalada_vo: "Desescalada verbal prioritária; VO se colaborativo (RASS 1–2).",
  contencao_quimica:
    "Desescalada verbal em paralelo à contenção química; considerar contenção física (RASS ≥3).",
};

export default function AgitacaoProtocol() {
  const [rass, setRass] = useState<RassAgita>(null);
  const [qtLongo, setQtLongo] = useState(false);

  const conduta = condutaAgita(rass);
  const organico = alertaCausaOrganica(rass);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="RASS (subconjunto agitação)">
        <select
          value={rass ?? ""}
          onChange={(e) => setRass(e.target.value === "" ? null : (Number(e.target.value) as RassAgita))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Selecionar RASS…</option>
          {RASS_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value ?? ""}>
              {o.label}
            </option>
          ))}
        </select>
        <CheckboxField
          label="Risco de QT longo / cardiopatia"
          checked={qtLongo}
          onChange={setQtLongo}
          description="Ajusta avisos nas opções medicamentosas"
        />
      </ProtocolPanel>

      <InfoBanner>
        <strong>{CONDUTA_LABEL[conduta]}</strong>
        <span className="mt-1 block text-xs opacity-80">Referência: Baldacara et al., 2019.</span>
      </InfoBanner>

      {organico && (
        <DangerBanner title="RASS ≥3 — investigar causa orgânica">
          <Link href="/dashboard/protocolos-clinicos?category=clinica-aguda&protocol=rebaixamento-consciencia" className="text-red-800 underline">
            Rebaixamento de consciência
          </Link>
          {" · "}
          <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=intoxicacao" className="text-red-800 underline">
            Intoxicação
          </Link>
        </DangerBanner>
      )}

      {(conduta === "desescalada_vo" || conduta === "contencao_quimica") && (
        <ProtocolPanel title="Opções farmacológicas (adulto)">
          <ul className="space-y-3">
            {OPCOES_FARMACO.filter((op) =>
              conduta === "desescalada_vo" ? op.id === "risper" : op.id !== "risper"
            ).map((op) => (
              <li key={op.id} className="rounded-lg border border-navy-900/10 bg-navy-50/50 p-3 text-sm">
                <p className="font-semibold text-navy-950">
                  {op.nome} — {op.grau}
                </p>
                <p className="mt-1 text-navy-800/80">{op.dose}</p>
                {(qtLongo || op.qtRisk) && (
                  <p className="mt-2 text-xs text-amber-900">
                    {op.qtRisk ? "Atenção QT/Torsades (ex.: droperidol — black box FDA). " : ""}
                    {qtLongo ? QT_IV_AVISO : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {conduta === "desescalada_vo" && (
            <p className="mt-3 text-xs text-navy-800/70">
              RASS 1–2: priorize desescalada; risperidona VO se colaborativo. Escalonar para IM se falha.
            </p>
          )}
        </ProtocolPanel>
      )}
    </div>
  );
}
