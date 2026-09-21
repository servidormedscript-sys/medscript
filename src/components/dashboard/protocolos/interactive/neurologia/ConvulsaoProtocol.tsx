"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  acidoValproicoMg,
  BENZO_MAX_DOSES,
  CAUSAS_INVESTIGACAO,
  diazepamMg,
  fenitoinaMg,
  fasePorTempo,
  levetiracetamMg,
  lorazepamMg,
  midazolamImMg,
  midazolamIvMg,
  precisaIOT,
  type FaseConvulsao,
} from "@/lib/clinical/protocols/interactive/neurologia/convulsao/logic";
import { avisoTetoDose, formatTimer } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import { CheckboxField, DangerBanner, DoseLogButton, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function ConvulsaoProtocol() {
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [faseManual, setFaseManual] = useState<FaseConvulsao | null>(null);
  const [peso, setPeso] = useState("");
  const [gestante, setGestante] = useState(false);
  const [glasgow, setGlasgow] = useState("15");
  const [hgt, setHgt] = useState("");
  const [benzoTotal, setBenzoTotal] = useState(0);
  const [causas, setCausas] = useState<boolean[]>(() => CAUSAS_INVESTIGACAO.map(() => false));

  useEffect(() => {
    if (!running || !startedAt) return;
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  const pesoN = Number(peso) || 70;
  const glasgowN = Number(glasgow) || 15;
  const hgtN = Number(hgt) || 0;
  const faseAuto = fasePorTempo(elapsedSec);
  const fase = faseManual ?? faseAuto;
  const benzoTeto = avisoTetoDose(benzoTotal, BENZO_MAX_DOSES, "Benzodiazepínicos (total)");
  const iot = precisaIOT(fase, glasgowN);

  function logBenzo() {
    if (benzoTotal >= BENZO_MAX_DOSES) return;
    setBenzoTotal((c) => c + 1);
  }

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Cronômetro (status epilepticus)">
        <p className="font-mono text-2xl font-bold text-navy-950">{formatTimer(elapsedSec)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!running ? (
            <button
              type="button"
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setRunning(true);
                setStartedAt(Date.now());
                setElapsedSec(0);
              }}
            >
              Iniciar
            </button>
          ) : (
            <>
              <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setRunning(false)}>
                Pausar
              </button>
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => {
                  setRunning(false);
                  setStartedAt(null);
                  setElapsedSec(0);
                  setFaseManual(null);
                }}
              >
                Resetar
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-sm">
          Fase: <strong>{fase}</strong> {faseManual ? "(manual)" : `(≥5 min →2, ≥20 →3, ≥40 →4)`}
        </p>
        <label className="mt-2 block text-sm">
          Forçar fase
          <select
            value={faseManual ?? ""}
            onChange={(e) => setFaseManual(e.target.value ? (Number(e.target.value) as FaseConvulsao) : null)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Automático</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4 (refratário)</option>
          </select>
        </label>
      </ProtocolPanel>

      <ProtocolPanel title="Paciente">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Glasgow
            <input type="number" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            HGT
            <input type="number" value={hgt} onChange={(e) => setHgt(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <CheckboxField label="Gestante" checked={gestante} onChange={setGestante} />
      </ProtocolPanel>

      {gestante && (
        <DangerBanner title="Gestante — investigar eclâmpsia; sulfato de magnésio associado (não substitui benzodiazepínicos)">
          <Link href="/dashboard/protocolos-clinicos?category=obstetricia&protocol=emergencias-obstetricas" className="text-red-800 underline">
            Emergências obstétricas
          </Link>
        </DangerBanner>
      )}
      {hgtN > 0 && hgtN < 70 && <DangerBanner title="Hipoglicemia — glicose IV imediata" />}
      {iot && (
        <DangerBanner title="Fase 4 ou Glasgow ≤8 — IOT" href="/dashboard/protocolos-clinicos?category=emergencia&protocol=isr" linkLabel="Abrir IOT" />
      )}

      <InfoBanner>
        Benzodiazepínicos registrados: {benzoTotal}/{BENZO_MAX_DOSES} (soma diazepam + midazolam + lorazepam)
        {benzoTeto.message && <span className="mt-1 block text-amber-900">{benzoTeto.message}</span>}
      </InfoBanner>

      <ProtocolPanel title="Medicações por fase">
        {(fase === 1 || fase === 2) && (
          <div className="space-y-2">
            <DoseLogButton label="Diazepam IV" detail={`${diazepamMg(pesoN).toFixed(1)} mg (0,2 mg/kg, máx. 10)`} onClick={logBenzo} disabled={benzoTeto.blocked} />
            <DoseLogButton label="Midazolam IV/IN" detail={`${midazolamIvMg(pesoN).toFixed(1)} mg`} onClick={logBenzo} disabled={benzoTeto.blocked} />
            <DoseLogButton label="Midazolam IM" detail={`${midazolamImMg(pesoN)} mg`} onClick={logBenzo} disabled={benzoTeto.blocked} />
            <DoseLogButton label="Lorazepam IV" detail={`${lorazepamMg(pesoN).toFixed(1)} mg`} onClick={logBenzo} disabled={benzoTeto.blocked} />
          </div>
        )}
        {fase === 3 && (
          <div className="space-y-2 text-sm">
            <p>Fenitoína: {fenitoinaMg(pesoN).toFixed(0)} mg (≤50 mg/min)</p>
            <p>Ácido valpróico: {acidoValproicoMg(pesoN).toFixed(0)} mg</p>
            <p>Levetiracetam: {levetiracetamMg(pesoN).toFixed(0)} mg/15 min</p>
          </div>
        )}
        {fase === 4 && (
          <div className="space-y-1 text-sm">
            <p>Propofol: bolus 1–2 mg/kg + infusão 2–10 mg/kg/h</p>
            <p>Midazolam: bolus 0,2 mg/kg + infusão 0,1–2 mg/kg/h</p>
            <p>Tiopental: bolus 3–5 mg/kg + infusão 3–5 mg/kg/h</p>
          </div>
        )}
      </ProtocolPanel>

      <ProtocolPanel title="Causas investigadas">
        {CAUSAS_INVESTIGACAO.map((c, i) => (
          <CheckboxField
            key={c}
            label={c}
            checked={causas[i]}
            onChange={(v) => {
              const n = [...causas];
              n[i] = v;
              setCausas(n);
            }}
          />
        ))}
      </ProtocolPanel>
    </div>
  );
}
