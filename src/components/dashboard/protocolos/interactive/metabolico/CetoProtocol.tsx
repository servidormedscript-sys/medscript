"use client";

import { useState } from "react";
import {
  condutaPotassio,
  gravidadeCad,
  insulinaUiH,
  precisaDextrose,
  volumePrimeiraHoraMl,
} from "@/lib/clinical/protocols/interactive/metabolico/ceto/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function CetoProtocol() {
  const [ph, setPh] = useState("");
  const [bic, setBic] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [k, setK] = useState("");
  const [peso, setPeso] = useState("");
  const [ir, setIr] = useState(false);
  const [sg5, setSg5] = useState(false);

  const phN = Number(ph) || 0;
  const bicN = Number(bic) || 0;
  const gN = Number(glicemia) || 0;
  const kN = Number(k) || 0;
  const pesoN = Number(peso) || 70;

  const grav = gravidadeCad(phN, bicN);
  const vol = volumePrimeiraHoraMl(pesoN);
  const ins = insulinaUiH(pesoN);
  const kCond = condutaPotassio(kN);
  const dextrose = precisaDextrose(gN);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Gasometria e eletrólitos">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["pH", ph, setPh],
            ["Bicarbonato (mEq/L)", bic, setBic],
            ["Glicemia (mg/dL)", glicemia, setGlicemia],
            ["Potássio (mEq/L)", k, setK],
            ["Peso (kg)", peso, setPeso],
          ].map((item) => {
            const [label, val, set] = item as [string, string, (v: string) => void];
            return (
            <label key={label} className="text-sm">
              {label}
              <input
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            );
          })}
        </div>
        <CheckboxField label="Insuficiência renal" checked={ir} onChange={setIr} description="Alerta clínico — não altera volume calculado" />
        <CheckboxField label="SG5% já associado" checked={sg5} onChange={setSg5} />
      </ProtocolPanel>

      <InfoBanner>
        Gravidade: <strong>{grav === "indefinida" ? "Preencha pH/bicarbonato" : grav.toUpperCase()}</strong>
      </InfoBanner>

      <ProtocolPanel title="Conduta">
        <p className="text-sm">
          SF 0,9% 1ª hora: <strong>{vol.min}–{vol.max} mL</strong> (15–20 mL/kg).
        </p>
        <p className="mt-2 text-sm">
          Insulina regular EV: <strong>{ins} UI/h</strong> (0,1 UI/kg/h, sem bolus — ADA 2024).
        </p>
        {kCond === "segurar_insulina" && (
          <p className="mt-2 text-sm text-red-800">K &lt;3,5: segurar insulina; repor KCl 20–40 mEq/h até K≥3,5.</p>
        )}
        {kCond === "repor_20_30" && (
          <p className="mt-2 text-sm">3,5≤K&lt;5: repor 20–30 mEq/L na hidratação.</p>
        )}
        {kCond === "sem_reposicao" && kN >= 5 && (
          <p className="mt-2 text-sm">K≥5: sem reposição; checar a cada 2 h.</p>
        )}
        {dextrose && !sg5 && (
          <p className="mt-2 text-sm text-amber-900">Glicemia &lt;250: associar SG5% 100–150 mL/h mantendo insulina.</p>
        )}
      </ProtocolPanel>
    </div>
  );
}
