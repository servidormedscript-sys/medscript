"use client";

import { useState } from "react";
import {
  categoriaTep,
  dDimerIdadeCutoff,
  precisaPert,
  spesiScore,
  yearsDDimerCutoff,
  yearsExcluiTeP,
} from "@/lib/clinical/protocols/interactive/respiratorio/tep/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const YEARS_LABELS = ["Sinais clínicos de TVP", "Hemoptise", "TEP como diagnóstico mais provável"];

export default function TepProtocol() {
  const [idade, setIdade] = useState("");
  const [pas, setPas] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [years, setYears] = useState([false, false, false]);
  const [dDimer, setDDimer] = useState("");
  const [spesi, setSpesi] = useState({
    idade80: false,
    cancer: false,
    cardiopulmonar: false,
    fc110: false,
    pas100: false,
    spo290: false,
  });
  const [hestiaCount, setHestiaCount] = useState(0);
  const [incidental, setIncidental] = useState(false);
  const [choqueRefratario, setChoqueRefratario] = useState(false);
  const [preFalencia, setPreFalencia] = useState(false);
  const [disfuncaoVd, setDisfuncaoVd] = useState(false);
  const [biomarcador, setBiomarcador] = useState(false);

  const idadeN = Number(idade) || 0;
  const pasN = Number(pas) || 0;
  const yearsN = years.filter(Boolean).length;
  const dN = Number(dDimer) || 0;
  const yearsCut = yearsDDimerCutoff(yearsN);
  const excluiYears = yearsExcluiTeP(dN, yearsN);
  const idadeCut = idadeN > 0 ? dDimerIdadeCutoff(idadeN) : null;
  const spesiN = spesiScore(spesi);

  const cat = categoriaTep({
    incidental,
    choqueRefratario,
    pas: pasN,
    preFalencia,
    spesi: spesiN,
    hestia: hestiaCount,
    disfuncaoVd,
    biomarcador,
  });

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Dados clínicos">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Idade", idade, setIdade],
            ["PAS", pas, setPas],
            ["FC", fc, setFc],
            ["FR", fr, setFr],
            ["SpO₂", spo2, setSpo2],
            ["D-dímero (ng/mL)", dDimer, setDDimer],
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
      </ProtocolPanel>

      <ProtocolPanel title="YEARS">
        {YEARS_LABELS.map((label, i) => (
          <CheckboxField
            key={label}
            label={label}
            checked={years[i]}
            onChange={(v) => {
              const n = [...years];
              n[i] = v;
              setYears(n);
            }}
          />
        ))}
        <p className="mt-2 text-sm">
          Critérios YEARS: {yearsN}. Corte D-dímero: <strong>{yearsCut} ng/mL</strong>
          {dN > 0 && (excluiYears ? " — abaixo do corte: TEP improvável (sem imagem)." : " — acima: considerar imagem.")}
        </p>
        {idadeCut != null && (
          <p className="mt-1 text-xs text-navy-800/70">Corte etário (idade&gt;50): {idadeCut} ng/mL quando fora do fluxo YEARS.</p>
        )}
      </ProtocolPanel>

      <ProtocolPanel title="sPESI">
        {(
          [
            ["Idade >80", "idade80"],
            ["Câncer ativo", "cancer"],
            ["DPOC / IC crônica", "cardiopulmonar"],
            ["FC ≥110", "fc110"],
            ["PAS <100", "pas100"],
            ["SpO₂ <90", "spo290"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={spesi[key]}
            onChange={(v) => setSpesi((p) => ({ ...p, [key]: v }))}
          />
        ))}
        <p className="mt-2 text-sm">sPESI: {spesiN} {spesiN === 0 ? "(baixo risco ~1% mortalidade 30d)" : "(risco elevado)"}</p>
      </ProtocolPanel>

      <ProtocolPanel title="Hestia e gravidade">
        <label className="text-sm">
          Critérios Hestia positivos (0–11)
          <input
            type="number"
            min={0}
            max={11}
            value={hestiaCount}
            onChange={(e) => setHestiaCount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <CheckboxField label="TEP incidental" checked={incidental} onChange={setIncidental} />
        <CheckboxField label="Choque refratário" checked={choqueRefratario} onChange={setChoqueRefratario} />
        <CheckboxField label="Pré-falência" checked={preFalencia} onChange={setPreFalencia} />
        <CheckboxField label="Disfunção VD" checked={disfuncaoVd} onChange={setDisfuncaoVd} />
        <CheckboxField label="Biomarcador elevado" checked={biomarcador} onChange={setBiomarcador} />
      </ProtocolPanel>

      <InfoBanner>
        Categoria: <strong>{cat}</strong>
        {hestiaCount === 0 ? " · Hestia 0: sem contraindicação ambulatorial relativa." : " · Hestia ≥1: internar."}
      </InfoBanner>

      {precisaPert(cat) && (
        <DangerBanner title={`Categoria ${cat} — acionar PERT (equipe de embolia pulmonar)`} />
      )}
    </div>
  );
}
