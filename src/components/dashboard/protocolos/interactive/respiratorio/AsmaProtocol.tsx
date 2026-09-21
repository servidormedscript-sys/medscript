"use client";

import { useState } from "react";
import {
  classificarAsma,
  prednisonaMg,
  sulfatoMagnesioMg,
  temRiscoVida,
} from "@/lib/clinical/protocols/interactive/respiratorio/asma/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AsmaProtocol() {
  const [spo2, setSpo2] = useState("");
  const [fr, setFr] = useState("");
  const [fc, setFc] = useState("");
  const [pfe, setPfe] = useState("");
  const [peso, setPeso] = useState("");
  const [pediatrico, setPediatrico] = useState(false);
  const [gestante, setGestante] = useState(false);
  const [silencioso, setSilencioso] = useState(false);
  const [confusao, setConfusao] = useState(false);
  const [cianose, setCianose] = useState(false);
  const [fala, setFala] = useState(false);
  const [musculatura, setMusculatura] = useState(false);

  const spo2N = Number(spo2) || 0;
  const frN = Number(fr) || 0;
  const pfeN = Number(pfe) || 0;
  const pesoN = Number(peso) || 70;

  const risco = temRiscoVida({ silencioso, confusao, cianose, spo2: spo2N, pfe: pfeN });
  const grav = classificarAsma({
    riscoVida: risco,
    falaDificil: fala,
    musculatura,
    spo2: spo2N,
    fr: frN,
    pfe: pfeN,
  });

  const bronco: Record<string, string> = {
    leve: "Salbutamol 4 jatos ou Budesonida-Formoterol 2 jatos",
    moderada: "Salbutamol 4–6 + Ipratrópio 4 jatos (ou neb 2,5+0,25 mg), até 3 ciclos",
    grave: "Salbutamol 6–10 + Ipratrópio; O₂ alvo 92–95%",
    muito_grave: "Início imediato; considerar adrenalina IM se anafilaxia associada",
  };

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Sinais vitais e PFE">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["SpO₂ (%)", spo2, setSpo2],
            ["FR", fr, setFr],
            ["FC", fc, setFc],
            ["PFE (% predito)", pfe, setPfe],
            ["Peso (kg)", peso, setPeso],
          ].map((item) => {
            const [l, v, s] = item as [string, string, (x: string) => void];
            return (
            <label key={l} className="text-sm">
              {l}
              <input type="number" value={v} onChange={(e) => s(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            );
          })}
        </div>
        <CheckboxField label="Pediátrico" checked={pediatrico} onChange={setPediatrico} />
        <CheckboxField label="Gestante" checked={gestante} onChange={setGestante} />
      </ProtocolPanel>

      <ProtocolPanel title="Sinais clínicos">
        {[
          ["Tórax silencioso", silencioso, setSilencioso],
          ["Confusão", confusao, setConfusao],
          ["Cianose", cianose, setCianose],
          ["Fala difícil", fala, setFala],
          ["Musculatura acessória", musculatura, setMusculatura],
        ].map(([label, c, set]) => (
          <CheckboxField key={String(label)} label={String(label)} checked={c as boolean} onChange={set as (v: boolean) => void} />
        ))}
      </ProtocolPanel>

      <InfoBanner>
        Gravidade: <strong>{grav.replace("_", " ").toUpperCase()}</strong>
        {grav === "leve" && " — alta possível após resposta."}
        {grav === "moderada" && " — observação / internação curta."}
        {(grav === "grave" || grav === "muito_grave") && " — internar / UTI."}
      </InfoBanner>

      {risco && (
        <DangerBanner
          title="Risco de vida — via aérea"
          href="/dashboard/protocolos-clinicos?category=emergencia&protocol=isr"
          linkLabel="Abrir IOT"
        />
      )}

      <ProtocolPanel title="Tratamento">
        <p className="text-sm font-medium">{bronco[grav]}</p>
        <p className="mt-2 text-sm">Prednisona: {prednisonaMg(pesoN, pediatrico)}</p>
        <p className="mt-1 text-sm">Hidrocortisona EV alternativa: 200 mg/dia dividida.</p>
        {(grav === "grave" || grav === "muito_grave" || pfeN < 25) && (
          <p className="mt-2 text-sm">Sulfato de magnésio: {sulfatoMagnesioMg(pesoN, pediatrico)}</p>
        )}
      </ProtocolPanel>
    </div>
  );
}
