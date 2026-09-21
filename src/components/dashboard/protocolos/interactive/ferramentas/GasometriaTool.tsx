"use client";

import { useMemo, useState } from "react";
import {
  anionGap,
  anionGapCorrigido,
  berlinSdra,
  classificarPh,
  classificarPrimario,
  compensacaoEsperada,
  deltaRatio,
  interpretarDeltaRatio,
  pafi,
  type GasoInput,
} from "@/lib/clinical/tools/gasometria/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function GasometriaTool() {
  const [tipo, setTipo] = useState<"arterial" | "venosa">("arterial");
  const [ph, setPh] = useState("");
  const [paco2, setPaco2] = useState("");
  const [hco3, setHco3] = useState("");
  const [pao2, setPao2] = useState("");
  const [fio2, setFio2] = useState("");
  const [na, setNa] = useState("");
  const [cl, setCl] = useState("");
  const [k, setK] = useState("");
  const [alb, setAlb] = useState("");
  const [lac, setLac] = useState("");
  const [respCronico, setRespCronico] = useState(false);

  const input: GasoInput | null = useMemo(() => {
    const pH = Number(ph);
    const co2 = Number(paco2);
    const bic = Number(hco3);
    if (!ph || !paco2 || !hco3) return null;
    if (pH < 6.5 || pH > 7.9) return null;
    return {
      ph: pH,
      paco2: co2,
      hco3: bic,
      pao2: Number(pao2) || undefined,
      fio2: Number(fio2) || undefined,
      na: Number(na) || undefined,
      cl: Number(cl) || undefined,
      k: Number(k) || undefined,
      albumina: Number(alb) || undefined,
      lactato: Number(lac) || undefined,
      respCronico,
    };
  }, [ph, paco2, hco3, pao2, fio2, na, cl, k, alb, lac, respCronico]);

  const primario = input ? classificarPrimario(input) : null;
  const comp = input && primario ? compensacaoEsperada(primario, input) : null;
  const ag = input?.na && input.cl ? anionGap(input.na, input.cl, input.hco3) : null;
  const agc = ag != null && input?.albumina ? anionGapCorrigido(ag, input.albumina) : ag;
  const dr = agc != null && input ? deltaRatio(agc, input.hco3) : null;
  const pf = input?.pao2 && input.fio2 ? pafi(input.pao2, input.fio2) : null;
  const phInvalid = ph && (Number(ph) < 6.5 || Number(ph) > 7.9);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Gasometria">
        <label className="text-sm">
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "arterial" | "venosa")} className="mt-1 rounded-lg border px-3 py-2">
            <option value="arterial">Arterial</option>
            <option value="venosa">Venosa</option>
          </select>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["pH", ph, setPh],
              ["PaCO₂", paco2, setPaco2],
              ["HCO₃", hco3, setHco3],
            ] as [string, string, (v: string) => void][]
          ).map(([l, v, s]) => (
            <label key={l} className="text-sm">
              {l}
              <input type="number" step="0.01" value={v} onChange={(e) => s(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          ))}
        </div>        <CheckboxField label="Distúrbio respiratório crônico (compensação)" checked={respCronico} onChange={setRespCronico} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["PaO₂", pao2, setPao2],
              ["FiO₂ %", fio2, setFio2],
              ["Na", na, setNa],
              ["Cl", cl, setCl],
              ["K", k, setK],
              ["Albumina", alb, setAlb],
              ["Lactato", lac, setLac],
            ] as [string, string, (v: string) => void][]
          ).map(([l, v, s]) => (
            <label key={l} className="text-sm">
              {l} (opc.)
              <input type="number" step="0.1" value={v} onChange={(e) => s(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          ))}
        </div>      </ProtocolPanel>

      {input ? (
        <InfoBanner>
          <p>Status pH: {classificarPh(input.ph)}</p>
          <p className="mt-1 font-semibold">{primario}</p>
          {comp && (
            <p className="mt-2 text-sm">
              {comp.label} esperado ≈ {comp.esperado.toFixed(1)} (±{comp.tol}) — medido:{" "}
              {comp.label.includes("PaCO") ? input.paco2 : input.hco3}
            </p>
          )}
          {ag != null && (
            <p className="mt-2 text-sm">
              Ânion gap: {ag.toFixed(0)} {agc != null && agc !== ag ? `(corrigido ${agc.toFixed(0)})` : ""}
              {dr != null ? ` · Delta ratio ${dr.toFixed(2)} — ${interpretarDeltaRatio(dr)}` : ""}
            </p>
          )}
          {tipo === "arterial" && input.pao2 != null && (
            <p className="mt-2 text-sm">
              PaO₂ {input.pao2 < 60 ? "hipoxemia grave" : input.pao2 < 80 ? "leve/moderada" : "preservada"}
              {pf != null ? ` · P/F ${pf.toFixed(0)} — ${berlinSdra(pf)}` : ""}
            </p>
          )}
          {input.lactato != null && (
            <p className="mt-2 text-sm">
              Lactato: {input.lactato > 4 ? "hiperlactatemia grave" : input.lactato > 2 ? "hiperlactatemia" : "normal"}
            </p>
          )}
          {(input.ph < 7.35 || input.ph > 7.45) && input.k != null && (
            <p className="mt-2 text-xs text-amber-900">K⁺ medido pode não refletir K⁺ corporal total (deslocamento celular).</p>
          )}
          <p className="mt-2 text-xs">Ponto de partida — correlacionar sempre com a história clínica.</p>
        </InfoBanner>
      ) : null}
    </div>
  );
}