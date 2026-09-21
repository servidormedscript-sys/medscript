"use client";

import { useState } from "react";
import { buscarInteracao, DRUGS, INTERACOES } from "@/lib/clinical/tools/interacoes/data";
import { InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function InteracoesTool() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const hit = buscarInteracao(a, b);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Checador de interações (emergência)">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Fármaco A
            <select value={a} onChange={(e) => setA(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">Selecionar…</option>
              {DRUGS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Fármaco B
            <select value={b} onChange={(e) => setB(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">Selecionar…</option>
              {DRUGS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        {a && b && a !== b && (
          hit ? (
            <div className={`mt-4 rounded-lg p-4 text-sm ${hit.severidade === "grave" ? "bg-red-50 text-red-900" : "bg-amber-50 text-amber-900"}`}>
              <strong className="uppercase">{hit.severidade}</strong>: {hit.a} + {hit.b} — {hit.texto}
            </div>
          ) : (
            <InfoBanner>
              Par não consta na lista curada — isso <strong>não descarta</strong> interação real. Cobertura limitada à emergência.
            </InfoBanner>
          )
        )}
      </ProtocolPanel>
      <ProtocolPanel title={`Referência — ${INTERACOES.length} pares cadastrados`}>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-xs">
          {INTERACOES.map((i) => (
            <li key={`${i.a}-${i.b}`}>
              <span className={i.severidade === "grave" ? "text-red-700" : "text-amber-800"}>{i.severidade}</span>: {i.a} + {i.b} — {i.texto}
            </li>
          ))}
        </ul>
      </ProtocolPanel>
    </div>
  );
}
