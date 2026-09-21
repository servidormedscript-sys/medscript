"use client";

import Link from "next/link";
import { useState } from "react";
import {
  heartCompleto,
  heartRisco,
  heartTotal,
  paduaScore,
  qsofaScore,
  wellsTeP,
} from "@/lib/clinical/tools/escores/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function EscoresTool() {
  const [qFr, setQFr] = useState("");
  const [qPas, setQPas] = useState("");
  const [qGcs, setQGcs] = useState("15");
  const [heart, setHeart] = useState([0, 0, 0, 0, 0]);
  const [wells, setWells] = useState({
    tvp: false,
    tepProvavel: false,
    fc100: false,
    imobilizacao: false,
    tepPrevio: false,
    hemoptise: false,
    cancer: false,
  });
  const [padua, setPadua] = useState<Record<string, boolean>>({
    cancer: false,
    tevPrevio: false,
    mobilidade: false,
    trombofilia: false,
    trauma: false,
    idade70: false,
    icResp: false,
    iamAvc: false,
    infeccao: false,
    obesidade: false,
    hormonal: false,
  });

  const qsofa = qsofaScore(Number(qFr) || 0, Number(qPas) || 0, Number(qGcs) || 15);
  const ht = heartTotal(heart);
  const ws = wellsTeP(wells);
  const ps = paduaScore(padua);

  function limpar() {
    setQFr("");
    setQPas("");
    setQGcs("15");
    setHeart([0, 0, 0, 0, 0]);
    setWells({
      tvp: false,
      tepProvavel: false,
      fc100: false,
      imobilizacao: false,
      tepPrevio: false,
      hemoptise: false,
      cancer: false,
    });
    setPadua(Object.fromEntries(Object.keys(padua).map((k) => [k, false])));
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={limpar} className="rounded-lg border px-4 py-2 text-sm font-semibold">
        Limpar tudo
      </button>

      <ProtocolPanel title="qSOFA">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            FR
            <input type="number" value={qFr} onChange={(e) => setQFr(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            PAS
            <input type="number" value={qPas} onChange={(e) => setQPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Glasgow
            <input type="number" value={qGcs} onChange={(e) => setQGcs(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <p className="mt-2 text-sm">
          qSOFA: {qsofa} {qsofa >= 2 ? "— rastreio positivo" : "— rastreio negativo (não afasta sepse)"}
        </p>
        <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto" className="text-xs text-ocean-800 underline">
          Protocolo sepse (em desenvolvimento) — estabilização
        </Link>
      </ProtocolPanel>

      <ProtocolPanel title="HEART">
        {["História", "ECG", "Idade", "Fatores risco", "Troponina"].map((label, i) => (
          <label key={label} className="mt-2 flex justify-between text-sm">
            {label}
            <select
              value={heart[i]}
              onChange={(e) => {
                const n = [...heart];
                n[i] = Number(e.target.value);
                setHeart(n);
              }}
              className="rounded border px-2"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
        ))}
        <p className="mt-2 text-sm">
          HEART: {ht}{" "}
          {heartCompleto(heart) ? `— ${heartRisco(ht)}` : "— preencha os 5 domínios"}
        </p>
        <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=sca-sem-supra-st" className="text-xs text-ocean-800 underline">
          SCA sem supra
        </Link>
      </ProtocolPanel>

      <ProtocolPanel title="Wells TEP (simplificado)">
        {(
          [
            ["Sinais TVP", "tvp"],
            ["TEP mais provável", "tepProvavel"],
            ["FC &gt;100", "fc100"],
            ["Imobilização/cirurgia", "imobilizacao"],
            ["TEP/TVP prévio", "tepPrevio"],
            ["Hemoptise", "hemoptise"],
            ["Câncer ativo", "cancer"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField key={key} label={label} checked={wells[key]} onChange={(v) => setWells((p) => ({ ...p, [key]: v }))} />
        ))}
        <p className="mt-2 text-sm">
          Wells: {ws.toFixed(1)} — {ws > 4 ? "TEP provável (angio-TC)" : "TEP improvável (D-dímero)"}
        </p>
        <Link href="/dashboard/protocolos-clinicos?category=respiratorio&protocol=tep" className="text-xs text-ocean-800 underline">
          Protocolo TEP
        </Link>
      </ProtocolPanel>

      <ProtocolPanel title="Padua (TEV internado)">
        {(
          [
            ["Câncer ativo", "cancer"],
            ["TEV prévio", "tevPrevio"],
            ["Mobilidade reduzida", "mobilidade"],
            ["Trombofilia", "trombofilia"],
            ["Trauma/cirurgia ≤1 mês", "trauma"],
            ["Idade ≥70", "idade70"],
            ["IC / IR", "icResp"],
            ["IAM / AVC agudo", "iamAvc"],
            ["Infecção/rumatológica", "infeccao"],
            ["Obesidade IMC≥30", "obesidade"],
            ["Terapia hormonal", "hormonal"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField key={key} label={label} checked={padua[key]} onChange={(v) => setPadua((p) => ({ ...p, [key]: v }))} />
        ))}
        <p className="mt-2 text-sm">
          Padua: {ps} — {ps >= 4 ? "Alto risco — profilaxia farmacológica" : "Baixo risco — deambulação precoce"}
        </p>
      </ProtocolPanel>

      <InfoBanner>
        Atalhos:{" "}
        <Link href="/dashboard/protocolos-clinicos?category=saude-mental&protocol=abstinencia-alcoolica" className="underline">
          CIWA-Ar completo
        </Link>
        {" · "}
        <Link href="/dashboard/protocolos-clinicos?category=saude-mental&protocol=risco-suicidio" className="underline">
          Risco de suicídio
        </Link>
      </InfoBanner>
    </div>
  );
}
