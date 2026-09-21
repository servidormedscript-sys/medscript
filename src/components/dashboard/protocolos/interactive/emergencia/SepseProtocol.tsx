"use client";

import Link from "next/link";
import { useState } from "react";
import {
  lactateInterpretation,
  qsofaFromVitals,
  volumeResuscitationMl,
} from "@/lib/clinical/protocols/interactive/emergencia/sepse/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function SepseProtocol() {
  const [fr, setFr] = useState("");
  const [pas, setPas] = useState("");
  const [confusao, setConfusao] = useState(false);
  const [peso, setPeso] = useState("");
  const [lactato, setLactato] = useState("");
  const [bundle, setBundle] = useState({
    lactato: false,
    culturas: false,
    antibiotico: false,
    volume: false,
    vasopressor: false,
  });

  const frN = Number(fr) || 0;
  const pasN = Number(pas) || 0;
  const pesoN = Number(peso) || 70;
  const q = qsofaFromVitals(frN, pasN, confusao);
  const vol = volumeResuscitationMl(pesoN);
  const lacN = Number(lactato) || 0;
  const lac = lacN > 0 ? lactateInterpretation(lacN) : null;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Rastreio (qSOFA)">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            FR
            <input type="number" value={fr} onChange={(e) => setFr(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            PAS
            <input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Lactato (mmol/L)
            <input type="number" step="0.1" value={lactato} onChange={(e) => setLactato(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <CheckboxField label="Alteração de consciência" checked={confusao} onChange={setConfusao} />
        <p className="mt-2 text-sm">
          qSOFA: <strong>{q}</strong>
          {q >= 2 ? " — rastreio positivo (investigar sepse)" : " — rastreio negativo (não exclui sepse)"}
        </p>
        {lac && (
          <p className="mt-1 text-sm">
            Lactato: {lac === "severe" ? "hiperlactatemia grave (>4)" : lac === "elevated" ? "elevado (2–4)" : "normal"}
          </p>
        )}
      </ProtocolPanel>

      {(q >= 2 || (pasN > 0 && pasN < 90)) && (
        <DangerBanner title="Suspeita de sepse / choque séptico">
          Iniciar bundle da 1ª hora e reavaliar perfusão.
        </DangerBanner>
      )}

      <ProtocolPanel title="Bundle 1ª hora">
        <p className="text-sm">Volume: cristaloide <strong>{vol.min} mL</strong> (30 mL/kg) — reavaliar perfusão.</p>
        {(
          [
            ["Medir lactato", "lactato"],
            ["Hemoculturas antes do ATB (se possível)", "culturas"],
            ["Antibiótico de amplo espectro ≤1 h", "antibiotico"],
            ["Volume 30 mL/kg", "volume"],
            ["Noradrenalina se hipotensão após volume", "vasopressor"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={bundle[key]}
            onChange={(v) => setBundle((p) => ({ ...p, [key]: v }))}
          />
        ))}
        <Link href="/dashboard/protocolos-clinicos?category=ferramentas&protocol=antibioticos" className="mt-2 inline-block text-sm text-ocean-800 underline">
          Referência antibióticos
        </Link>
      </ProtocolPanel>

      <InfoBanner>Reavaliar lactato e perfusão; considerar UTI e foco infeccioso.</InfoBanner>
    </div>
  );
}
