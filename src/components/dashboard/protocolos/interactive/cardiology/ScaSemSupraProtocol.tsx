"use client";

import Link from "next/link";
import { useState } from "react";
import {
  diagnosticoSca,
  estrategiaInvasiva,
  heartDomainAge,
  heartDomainTroponina,
  heartMaceLabel,
  heartRisco,
  heartTotal,
} from "@/lib/clinical/protocols/interactive/cardiology/sca-sem-supra/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function ScaSemSupraProtocol() {
  const [idade, setIdade] = useState("");
  const [troponinaRatio, setTroponinaRatio] = useState("");
  const [domains, setDomains] = useState([0, 0, 0, 0, 0]);
  const [instabilidade, setInstabilidade] = useState([false, false, false, false]);
  const [autoAge, setAutoAge] = useState(true);
  const [autoTrop, setAutoTrop] = useState(true);

  const idadeN = Number(idade) || 0;
  const ratio = Number(troponinaRatio) || 0;
  const d = [...domains];
  if (autoAge && idadeN) d[2] = heartDomainAge(idadeN);
  if (autoTrop) d[4] = heartDomainTroponina(ratio);

  const total = heartTotal(d);
  const risco = heartRisco(total);
  const tropPos = ratio > 1;
  const diag = diagnosticoSca(tropPos);
  const inst = instabilidade.some(Boolean);
  const estrategia = estrategiaInvasiva(inst, risco, tropPos);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="HEART Score (0–10)">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Idade
            <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Troponina (× LSN)
            <input type="number" step="0.1" value={troponinaRatio} onChange={(e) => setTroponinaRatio(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <CheckboxField label="Auto: idade no domínio HEART" checked={autoAge} onChange={setAutoAge} />
        <CheckboxField label="Auto: troponina no domínio HEART" checked={autoTrop} onChange={setAutoTrop} />
        {["História (0–2)", "ECG (0–2)", "Idade (0–2)", "Fatores risco (0–2)", "Troponina (0–2)"].map(
          (label, i) => (
            <label key={label} className="mt-2 flex items-center justify-between text-sm">
              {label}
              <select
                value={d[i]}
                onChange={(e) => {
                  const next = [...d];
                  next[i] = Number(e.target.value);
                  setDomains(next);
                  if (i === 2) setAutoAge(false);
                  if (i === 4) setAutoTrop(false);
                }}
                className="rounded border px-2 py-1"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
          )
        )}
        <p className="mt-3 text-sm font-semibold">
          HEART: {total} — {risco} · {heartMaceLabel(risco)}
        </p>
      </ProtocolPanel>

      <ProtocolPanel title="Diagnóstico e estratégia">
        <p className="text-sm">
          Diagnóstico: <strong>{diag === "IAMSSST" ? "IAMSSST" : "Angina instável"}</strong>
        </p>
        <div className="mt-2 space-y-2">
          {["Hipotensão / choque", "Arritmia maligna", "Dor refratária", "Instabilidade hemodinâmica"].map(
            (label, i) => (
              <CheckboxField
                key={label}
                label={label}
                checked={instabilidade[i]}
                onChange={(v) => {
                  const n = [...instabilidade];
                  n[i] = v;
                  setInstabilidade(n);
                }}
              />
            )
          )}
        </div>
        <InfoBanner>
          Estratégia invasiva: <strong>{estrategia}</strong>
        </InfoBanner>
        {inst ? (
          <p className="mt-2 text-sm">
            <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico" className="text-ocean-800 underline">Choque</Link>
            {" · "}
            <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=iam-supra-st" className="text-ocean-800 underline">IAM com supra</Link>
          </p>
        ) : null}
      </ProtocolPanel>

      <ProtocolPanel title="Checklist medicamentoso">
        <ul className="space-y-1 text-sm text-navy-800/75">
          <li>AAS 160–300 mg ataque → 75–100 mg/dia</li>
          <li>Ticagrelor 180 mg ou Clopidogrel 300–600 mg</li>
          <li>Fondaparinux 2,5 mg/dia ou Enoxaparina 1 mg/kg 12/12h</li>
          <li>Nitrato SL/EV (evitar se PAS &lt; 90 ou iPDE5 recente)</li>
          <li>BB em 24 h se sem IC/choque/broncoespasmo</li>
          <li>Estatina alta potência (Atorvastatina 80 mg ou Rosuvastatina 20–40 mg)</li>
        </ul>
      </ProtocolPanel>
    </div>
  );
}
