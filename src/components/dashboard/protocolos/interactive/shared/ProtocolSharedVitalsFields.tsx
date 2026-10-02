"use client";

import { useState } from "react";
import { useSyncProtocolVitals } from "@/lib/inpatient/use-sync-protocol-vitals";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-2 py-1.5 text-sm text-navy-950 outline-none focus:border-navy-700";

/** Vitais opcionais sincronizados com Internar paciente (protocolos com ProtocolCalcAssist). */
export default function ProtocolSharedVitalsFields() {
  const [pas, setPas] = useState("");
  const [pad, setPad] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temperature, setTemperature] = useState("");
  const [glasgow, setGlasgow] = useState("");

  useSyncProtocolVitals({
    pas,
    pad,
    fc,
    fr,
    spo2,
    temperature,
    glasgow,
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <label className="text-[11px] text-navy-800/60">
        PAS
        <input className={inputClass} value={pas} onChange={(e) => setPas(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        PAD
        <input className={inputClass} value={pad} onChange={(e) => setPad(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        FC
        <input className={inputClass} value={fc} onChange={(e) => setFc(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        FR
        <input className={inputClass} value={fr} onChange={(e) => setFr(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        SpO₂ %
        <input className={inputClass} value={spo2} onChange={(e) => setSpo2(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        Temp °C
        <input className={inputClass} value={temperature} onChange={(e) => setTemperature(e.target.value)} inputMode="decimal" />
      </label>
      <label className="text-[11px] text-navy-800/60">
        Glasgow
        <input className={inputClass} value={glasgow} onChange={(e) => setGlasgow(e.target.value)} inputMode="numeric" />
      </label>
    </div>
  );
}
