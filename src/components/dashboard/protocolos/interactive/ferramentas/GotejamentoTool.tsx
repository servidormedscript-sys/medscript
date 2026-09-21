"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  calcGotejamento,
  DoseUnit,
  getPreset,
  PRESETS,
  unitNeedsWeight,
} from "@/lib/clinical/tools/gotejamento/logic";
import { InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const UNITS: DoseUnit[] = ["mcg/kg/min", "mcg/min", "mcg/kg/h", "mg/kg/h", "mg/h", "g/h"];

export default function GotejamentoTool() {
  const params = useSearchParams();
  const [presetKey, setPresetKey] = useState("personalizado");
  const [mg, setMg] = useState("");
  const [vol, setVol] = useState("250");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState<DoseUnit>("mcg/kg/min");
  const [peso, setPeso] = useState("");

  useEffect(() => {
    const p = params.get("preset");
    const d = params.get("dose");
    const w = params.get("weight");
    if (p) aplicarPreset(p, d ? Number(d) : undefined);
    if (w && !peso) setPeso(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function aplicarPreset(key: string, doseVal?: number) {
    const pr = getPreset(key);
    if (!pr) return;
    setPresetKey(key);
    if (key !== "personalizado") {
      setMg(String(pr.mg));
      setVol(String(pr.volumeMl));
      setUnit(pr.unit);
      setDose(String(doseVal ?? pr.doseSugerida ?? ""));
    }
  }

  const pesoN = Number(peso) || 0;
  const result = useMemo(() => {
    const needsW = unitNeedsWeight(unit);
    if (needsW && pesoN <= 0) return null;
    return calcGotejamento({
      mg: Number(mg) || 0,
      volumeMl: Number(vol) || 0,
      dose: Number(dose) || 0,
      unit,
      pesoKg: pesoN || 70,
    });
  }, [mg, vol, dose, unit, pesoN]);

  const resumo = result
    ? `Bomba: ${result.mlH.toFixed(1)} mL/h · Macrogotas: ${result.gotasMin.toFixed(1)} gts/min · Microgotas: ${result.microgotasMin.toFixed(1)}/min · ${result.mcgMin.toFixed(1)} mcg/min total`
    : unitNeedsWeight(unit) && pesoN <= 0
      ? "Informe o peso para calcular."
      : "Preencha diluição e dose.";

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Calculadora de gotejamento">
        <label className="text-sm">
          Fármaco (preset)
          <select
            value={presetKey}
            onChange={(e) => aplicarPreset(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            mg na ampola/frasco
            <input type="number" value={mg} onChange={(e) => setMg(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Volume diluente (mL)
            <input type="number" value={vol} onChange={(e) => setVol(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Dose desejada
            <input type="number" step="0.01" value={dose} onChange={(e) => setDose(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Unidade
            <select value={unit} onChange={(e) => setUnit(e.target.value as DoseUnit)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
      </ProtocolPanel>
      <InfoBanner>
        <strong>{resumo}</strong>
        <p className="mt-2 text-xs">Conferir diluição e taxa conforme protocolo institucional antes de prescrever.</p>
      </InfoBanner>
    </div>
  );
}
