"use client";

import Link from "next/link";
import { useState } from "react";
import {
  riscoCssrs,
  sadPersonsInterpretacao,
  sadPersonsScore,
  SAD_PERSONS_LABELS,
  type SadPersonsKey,
} from "@/lib/clinical/protocols/interactive/saude-mental/suicidio/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const initialSad = (): Record<SadPersonsKey, boolean> =>
  Object.keys(SAD_PERSONS_LABELS).reduce(
    (acc, k) => ({ ...acc, [k]: false }),
    {} as Record<SadPersonsKey, boolean>
  );

export default function SuicidioProtocol() {
  const [intencaoPlano, setIntencaoPlano] = useState(false);
  const [comportamentoRecente, setComportamentoRecente] = useState(false);
  const [metodoPensado, setMetodoPensado] = useState(false);
  const [comportamentoAntigo, setComportamentoAntigo] = useState(false);
  const [ideacao, setIdeacao] = useState(false);
  const [sad, setSad] = useState(initialSad);

  const cssrs = riscoCssrs({
    intencaoPlano,
    comportamentoRecente,
    metodoPensado,
    comportamentoAntigo,
    ideacaoPassivaAtiva: ideacao,
  });
  const sadScore = sadPersonsScore(sad);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Algoritmo C-SSRS (hierárquico)">
        <CheckboxField
          label="Intenção / plano específico"
          checked={intencaoPlano}
          onChange={setIntencaoPlano}
        />
        <CheckboxField
          label="Comportamento suicida recente (≤3 meses)"
          checked={comportamentoRecente}
          onChange={setComportamentoRecente}
        />
        <CheckboxField label="Método pensado (sem plano completo)" checked={metodoPensado} onChange={setMetodoPensado} />
        <CheckboxField
          label="Comportamento suicida antigo (>3 meses)"
          checked={comportamentoAntigo}
          onChange={setComportamentoAntigo}
        />
        <CheckboxField
          label="Ideação passiva ou ativa não específica"
          checked={ideacao}
          onChange={setIdeacao}
        />
        <p className="mt-3 text-sm font-semibold">
          Risco C-SSRS: <span className="uppercase">{cssrs}</span>
        </p>
      </ProtocolPanel>

      <ProtocolPanel title="SAD PERSONS (0–10)">
        {(Object.keys(SAD_PERSONS_LABELS) as SadPersonsKey[]).map((key) => (
          <CheckboxField
            key={key}
            label={SAD_PERSONS_LABELS[key]}
            checked={sad[key]}
            onChange={(v) => setSad((p) => ({ ...p, [key]: v }))}
          />
        ))}
        <p className="mt-3 text-sm">
          SAD PERSONS: <strong>{sadScore}</strong> — {sadPersonsInterpretacao(sadScore)}
        </p>
      </ProtocolPanel>

      {cssrs === "alto" && (
        <DangerBanner title="Risco alto — não deixar sozinho; retirar objetos de risco; avaliação psiquiátrica antes de alta">
          <Link
            href="/dashboard/protocolos-clinicos?category=saude-mental-uti&protocol=agitacao"
            className="mt-2 inline-block text-sm font-semibold text-red-800 underline"
          >
            Agitação psicomotora
          </Link>
          <p className="mt-2 text-xs">
            Internação involuntária: Lei 10.216/2001 — critérios legais e documentação adequada.
          </p>
        </DangerBanner>
      )}

      {(cssrs === "moderado" || sadScore >= 6) && cssrs !== "alto" && (
        <InfoBanner>Avaliação psiquiátrica recomendada antes de definir alta ou manejo ambulatorial.</InfoBanner>
      )}
    </div>
  );
}
