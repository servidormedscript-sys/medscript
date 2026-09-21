"use client";

import { useMemo, useState } from "react";
import { CLASSES_ATB, filtrarAtb } from "@/lib/clinical/tools/antibioticos/data";
import { ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AntibioticosTool() {
  const [classe, setClasse] = useState("Todos");
  const [busca, setBusca] = useState("");
  const lista = useMemo(() => filtrarAtb(classe, busca), [classe, busca]);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Antibióticos — referência rápida">
        <p className="text-xs text-navy-800/60">
          Consulta rápida — não substitui bula/protocolo local. Doses em texto fixo (sem cálculo por peso no app).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Classe
            <select value={classe} onChange={(e) => setClasse(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {CLASSES_ATB.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Busca
            <input value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Nome, indicação…" />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          {lista.map((item) => (
            <article key={item.nome} className="rounded-lg border border-navy-900/10 p-3 text-sm">
              <p className="font-semibold">
                {item.nome}{" "}
                <span className="text-xs font-normal text-navy-800/60">({item.classe})</span>
              </p>
              <p className="mt-1">Dose: {item.dose}</p>
              <p>Infusão: {item.diluicao}</p>
              <p>Renal: {item.renal}</p>
              {item.alerta && (
                <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{item.alerta}</span>
              )}
            </article>
          ))}
        </div>
      </ProtocolPanel>
    </div>
  );
}
