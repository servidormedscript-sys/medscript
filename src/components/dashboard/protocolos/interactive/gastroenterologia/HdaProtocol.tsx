"use client";

import Link from "next/link";
import { useState } from "react";
import {
  gbsRisco,
  gbsTotal,
  instabilidadeHda,
  rockallClinico,
} from "@/lib/clinical/protocols/interactive/gastroenterologia/hda/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function HdaProtocol() {
  const [ureia, setUreia] = useState("");
  const [hb, setHb] = useState("");
  const [sexo, setSexo] = useState<"H" | "M">("H");
  const [pas, setPas] = useState("");
  const [fc, setFc] = useState("");
  const [idade, setIdade] = useState("");
  const [melena, setMelena] = useState(false);
  const [sincope, setSincope] = useState(false);
  const [hepatopatia, setHepatopatia] = useState(false);
  const [ic, setIc] = useState(false);
  const [comorbidadeGrave, setComorbidadeGrave] = useState(false);
  const [anticoag, setAnticoag] = useState(false);

  const gbs = gbsTotal({
    ureia: Number(ureia) || 0,
    hb: Number(hb) || 0,
    sexo,
    pas: Number(pas) || 0,
    fc: Number(fc) || 0,
    melena,
    sincope,
    hepatopatia,
    ic,
  });
  const riscoGbs = gbsRisco(gbs);
  const rockall = rockallClinico({
    idade: Number(idade) || 0,
    pas: Number(pas) || 0,
    fc: Number(fc) || 0,
    comorbidadeGrave,
    icOuHepato: ic || hepatopatia,
  });
  const instavel = instabilidadeHda(Number(pas) || 0, Number(fc) || 0);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Glasgow-Blatchford">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Ureia (mg/dL)", ureia, setUreia],
            ["Hemoglobina (g/dL)", hb, setHb],
            ["PAS", pas, setPas],
            ["FC", fc, setFc],
            ["Idade", idade, setIdade],
          ].map((item) => {
            const [l, v, s] = item as [string, string, (x: string) => void];
            return (
            <label key={l} className="text-sm">
              {l}
              <input type="number" value={v} onChange={(e) => s(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            );
          })}
          <label className="text-sm">
            Sexo (Hb)
            <select value={sexo} onChange={(e) => setSexo(e.target.value as "H" | "M")} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="H">Homem</option>
              <option value="M">Mulher</option>
            </select>
          </label>
        </div>
        <CheckboxField label="Melena" checked={melena} onChange={setMelena} />
        <CheckboxField label="Síncope" checked={sincope} onChange={setSincope} />
        <CheckboxField label="Hepatopatia" checked={hepatopatia} onChange={setHepatopatia} />
        <CheckboxField label="Insuficiência cardíaca" checked={ic} onChange={setIc} />
        <CheckboxField label="Comorbidade grave (Rockall)" checked={comorbidadeGrave} onChange={setComorbidadeGrave} />
        <CheckboxField label="Anticoagulante" checked={anticoag} onChange={setAnticoag} />
      </ProtocolPanel>

      <InfoBanner>
        GBS: <strong>{gbs}</strong> — risco {riscoGbs}
        {gbs === 0 && " (ambulatorial possível)"}
        {gbs > 0 && gbs < 7 && " (intermediário)"}
        {gbs >= 7 && " (alto risco)"}
        <span className="mt-1 block">Rockall clínico pré-endoscópico: {rockall}/7</span>
      </InfoBanner>

      {instavel && (
        <DangerBanner title="Instabilidade" href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico" linkLabel="Choque hemorrágico" />
      )}

      <ProtocolPanel title="Conduta inicial">
        <p className="text-sm">IBP EV: pantoprazol/omeprazol 80 mg bolus + 8 mg/h ×72 h (ou 40 mg 12/12h).</p>
        <p className="mt-2 text-sm">Transfusão: meta Hb ≥7 g/dL (≥8 se cardiopatia isquêmica/instabilidade).</p>
        {hepatopatia && (
          <p className="mt-2 text-sm">Suspeita varizes: terlipressina 2 mg 4/4h (ou octreotide) + ceftriaxona 1 g/dia ×7 dias.</p>
        )}
        <p className="mt-2 text-sm">
          Endoscopia: urgente (&lt;12 h) se instabilidade refratária, varizes ou hematêmese ativa; precoce (&lt;24 h) se GBS≥1 ou Rockall≥1.
        </p>
        {anticoag && <p className="mt-2 text-xs text-amber-900">Anticoagulante: individualizar reversão/suspensão.</p>}
      </ProtocolPanel>
    </div>
  );
}
