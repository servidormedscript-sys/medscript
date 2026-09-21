"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ADHERE_MORTALIDADE,
  adhereGrupo,
  grauCongestao,
  grauHipoperfusao,
  perfilIc,
} from "@/lib/clinical/protocols/interactive/cardiology/icad/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function IcadProtocol() {
  const [estertores, setEstertores] = useState(false);
  const [ortopneia, setOrtopneia] = useState(false);
  const [edema, setEdema] = useState(false);
  const [turgencia, setTurgencia] = useState(false);
  const [hepato, setHepato] = useState(false);
  const [tec, setTec] = useState(false);
  const [frias, setFrias] = useState(false);
  const [confusao, setConfusao] = useState(false);
  const [sonolencia, setSonolencia] = useState(false);
  const [lactato, setLactato] = useState(false);
  const [ureia, setUreia] = useState("");
  const [pas, setPas] = useState("");
  const [creat, setCreat] = useState("");
  const [feReduzida, setFeReduzida] = useState(false);
  const [feValor, setFeValor] = useState("");
  const [diurese, setDiurese] = useState<"insuficiente" | "parcial" | "adequada">("parcial");

  const pp = (estertores ? 1 : 0) + (ortopneia ? 1 : 0);
  const ps = (edema ? 1 : 0) + (turgencia ? 1 : 0) + (hepato ? 1 : 0);
  const hipPts =
    (tec ? 1 : 0) +
    (frias ? 1 : 0) +
    (confusao ? 2 : 0) +
    (sonolencia ? 2 : 0) +
    (lactato ? 2 : 0);

  const congesto = pp >= 1 || ps >= 1;
  const hipoperfundido = hipPts >= 1;
  const perfil = perfilIc(congesto, hipoperfundido);
  const adhere = adhereGrupo(Number(ureia) || 0, Number(pas) || 0, Number(creat) || 0);
  const sglt2 = feReduzida || (Number(feValor) > 0 && Number(feValor) <= 40);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Congestão">
        <CheckboxField label="Estertores" checked={estertores} onChange={setEstertores} />
        <CheckboxField label="Ortopneia" checked={ortopneia} onChange={setOrtopneia} />
        <CheckboxField label="Edema MMII" checked={edema} onChange={setEdema} />
        <CheckboxField label="Turgência jugular" checked={turgencia} onChange={setTurgencia} />
        <CheckboxField label="Hepatomegalia" checked={hepato} onChange={setHepato} />
        <p className="mt-2 text-sm">Grau: {grauCongestao(pp, ps)}</p>
      </ProtocolPanel>

      <ProtocolPanel title="Hipoperfusão">
        <CheckboxField label="TEC lento" checked={tec} onChange={setTec} />
        <CheckboxField label="Extremidades frias" checked={frias} onChange={setFrias} />
        <CheckboxField label="Confusão" checked={confusao} onChange={setConfusao} />
        <CheckboxField label="Sonolência" checked={sonolencia} onChange={setSonolencia} />
        <CheckboxField label="Lactato > 2" checked={lactato} onChange={setLactato} />
        <p className="mt-2 text-sm">Grau: {grauHipoperfusao(hipPts)}</p>
      </ProtocolPanel>

      <InfoBanner>
        Perfil: <strong>{perfil.replace("-", " e ")}</strong>
      </InfoBanner>

      <ProtocolPanel title="ADHERE (CART)">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Ureia<input type="number" value={ureia} onChange={(e) => setUreia(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">PAS<input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">Creat<input type="number" step="0.1" value={creat} onChange={(e) => setCreat(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        </div>
        <p className="mt-2 text-sm">
          Grupo {adhere} — mortalidade hospitalar ~{ADHERE_MORTALIDADE[adhere]}
        </p>
      </ProtocolPanel>

      <ProtocolPanel title="Tratamento e resposta diurética">
        <select
          value={diurese}
          onChange={(e) => setDiurese(e.target.value as typeof diurese)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="insuficiente">&lt;20 mL/h — insuficiente</option>
          <option value="parcial">20–30 mL/h — parcial</option>
          <option value="adequada">≥30 mL/h — adequada</option>
        </select>
        <ul className="mt-3 space-y-1 text-sm text-navy-800/75">
          <li>Frio-Congesto: Dobutamina 2,5 mcg/kg/min (até 20); Furosemida 40–80 mg após PA.</li>
          <li>Quente-Congesto: Furosemida; NTG 10 mcg/min (até 200); Nitroprussiato 0,3 mcg/kg/min se HAS grave.</li>
          <li>Frio-Seco: Expansão 250 mL / 30 min.</li>
        </ul>
        <CheckboxField label="Fração reduzida conhecida" checked={feReduzida} onChange={setFeReduzida} />
        <label className="mt-2 block text-sm">
          FE (%)
          <input type="number" value={feValor} onChange={(e) => setFeValor(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        {sglt2 ? (
          <p className="mt-2 text-sm text-emerald-900">
            iSGLT2 indicado (Dapagliflozina/Empagliflozina 10 mg/dia). Espironolactona 25–50 mg se FE ≤35%
            (CI K&gt;5 ou TFG&lt;30).
          </p>
        ) : null}
        <p className="mt-2 text-xs text-amber-800">
          Nunca ARNI + IECA (washout 36 h). BB contraindicado em choque cardiogênico.
        </p>
        <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=isr" className="mt-2 inline-block text-sm text-ocean-800 underline">
          Abrir IOT (repassar peso manualmente)
        </Link>
      </ProtocolPanel>
    </div>
  );
}
