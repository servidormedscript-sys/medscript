"use client";

import Link from "next/link";
import { useState } from "react";
import {
  fibrinoliseIndicada,
  graceRisco,
  graceScore,
  heparinaBolusUi,
  heparinaInfusaoUi,
} from "@/lib/clinical/protocols/interactive/cardiology/iam-supra/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function IamSupraProtocol() {
  const [horas, setHoras] = useState("");
  const [angio, setAngio] = useState(true);
  const [peso, setPeso] = useState("");
  const [idade, setIdade] = useState("");
  const [fc, setFc] = useState("");
  const [pas, setPas] = useState("");
  const [killip, setKillip] = useState<"1" | "2" | "3" | "4">("1");
  const [supra, setSupra] = useState(true);
  const [p2y12, setP2y12] = useState<"prasugrel" | "clopidogrel" | "ticagrelor">("ticagrelor");

  const pesoN = Number(peso) || 70;
  const fibrin = fibrinoliseIndicada(Number(horas) || 99, angio);
  const grace = graceScore({
    idade: Number(idade) || 60,
    fc: Number(fc) || 80,
    pas: Number(pas) || 120,
    killip: Number(killip) as 1 | 2 | 3 | 4,
    supraSt: supra,
  });
  const risco = graceRisco(grace);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Estratégia de reperfusão">
        <label className="text-sm">
          Horas de dor
          <input type="number" value={horas} onChange={(e) => setHoras(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <CheckboxField label="Angioplastia primária disponível" checked={angio} onChange={setAngio} />
        <InfoBanner>
          {fibrin ? (
            <strong>Fibrinólise indicada</strong>
          ) : (
            <strong>Angioplastia primária preferencial</strong>
          )}{" "}
          (janela ≤12 h).
        </InfoBanner>
      </ProtocolPanel>

      <ProtocolPanel title="GRACE simplificado">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Idade<input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">FC<input type="number" value={fc} onChange={(e) => setFc(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">PAS<input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm">
            Killip
            <select value={killip} onChange={(e) => setKillip(e.target.value as "1" | "2" | "3" | "4")} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="1">I</option>
              <option value="2">II</option>
              <option value="3">III</option>
              <option value="4">IV</option>
            </select>
          </label>
        </div>
        <CheckboxField label="Supra de ST no ECG (+30 pts)" checked={supra} onChange={setSupra} />
        <p className="mt-2 text-sm font-semibold">
          GRACE: {grace} — risco {risco} (
          {risco === "baixo" ? "<1%" : risco === "intermediario" ? "1–3%" : ">3%"} mortalidade)
        </p>
        <p className="text-xs text-navy-800/55">Versão simplificada — considerar creatinina/enzimas no cálculo completo.</p>
      </ProtocolPanel>

      <ProtocolPanel title="Antiplaquetário P2Y12">
        <select
          value={p2y12}
          onChange={(e) => setP2y12(e.target.value as typeof p2y12)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          <option value="ticagrelor">Ticagrelor 180 mg (angioplastia)</option>
          <option value="prasugrel">Prasugrel 60 mg (CI se AVC/AIT)</option>
          <option value="clopidogrel">Clopidogrel 600 / 300 / sem ataque (fibrinolítico)</option>
        </select>
        <p className="mt-2 text-sm">AAS 300 mg + manutenção. Peso {pesoN} kg.</p>
      </ProtocolPanel>

      <ProtocolPanel title="Anticoagulação">
        <p className="text-sm">
          HNF bolus {heparinaBolusUi(pesoN)} UI (60–70×peso, máx. 5000) · Infusão{" "}
          {heparinaInfusaoUi(pesoN)}–{Math.round(15 * pesoN)} UI/h
        </p>
        <p className="mt-1 text-sm">Enoxaparina {Math.round(pesoN)} mg SC 12/12h · Fondaparinux 2,5 mg/dia.</p>
      </ProtocolPanel>

      <p className="text-sm">
        Complicações:{" "}
        <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=taquiarritmias" className="text-ocean-800 underline">
          Taquiarritmias
        </Link>
        ,{" "}
        <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico" className="text-ocean-800 underline">
          Choque
        </Link>
      </p>
    </div>
  );
}
