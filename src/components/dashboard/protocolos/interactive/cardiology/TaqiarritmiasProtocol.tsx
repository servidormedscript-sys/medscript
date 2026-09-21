"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adenosinaDoseMg,
  alertaWpw,
  CARDIOVERSAO_J,
  cha2ds2vaInterpretacao,
  cha2ds2vaScore,
  classificarTipo,
  diltiazemMg,
  enoxaparinaMg,
  hasBledScore,
  heparinaBolusUi,
  instavel,
  METOPROLOL_MAX_DOSES,
  METOPROLOL_MG,
  procainamidaTetoMg,
  type Cha2ds2vaKey,
  type HasBledKey,
  type TipoTaqui,
} from "@/lib/clinical/protocols/interactive/cardiology/taqiarritmias/logic";
import { avisoTetoDose, formatTimer } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import {
  CheckboxField,
  DangerBanner,
  DoseLogButton,
  InfoBanner,
  ProtocolPanel,
} from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const INSTABILIDADE_LABELS = [
  "Dor torácica isquêmica",
  "Dispneia / edema agudo",
  "Alteração de consciência",
  "Choque / hipotensão",
  "Sinais de perfusão inadequada",
];

const TIPO_LABEL: Record<TipoTaqui, string> = {
  tsvp: "TSVP (QRS estreito, regular)",
  "fa-flutter": "FA / Flutter (QRS estreito, irregular)",
  "tv-pulso": "TV com pulso (QRS largo)",
};

export default function TaqiarritmiasProtocol() {
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [pas, setPas] = useState("");
  const [fc, setFc] = useState("");
  const [peso, setPeso] = useState("");
  const [idade, setIdade] = useState("");
  const [qrsEstreito, setQrsEstreito] = useState(true);
  const [rrRegular, setRrRegular] = useState(true);
  const [instabilidade, setInstabilidade] = useState([false, false, false, false, false]);

  const [adenosinaN, setAdenosinaN] = useState(0);
  const [metoprololN, setMetoprololN] = useState(0);
  const [diltiazemN, setDiltiazemN] = useState(0);
  const [amiodaronaMgTotal, setAmiodaronaMgTotal] = useState(0);
  const [magnesioN, setMagnesioN] = useState(0);
  const [cardioN, setCardioN] = useState(0);

  const [cha, setCha] = useState<Record<Cha2ds2vaKey, boolean>>({
    ic: false,
    has: false,
    dm: false,
    avc: false,
    vascular: false,
  });
  const [bled, setBled] = useState<Record<HasBledKey, boolean>>({
    has: false,
    renal: false,
    hepatica: false,
    avc: false,
    sangramento: false,
    inr: false,
    idade: false,
    aas: false,
    etilismo: false,
  });

  useEffect(() => {
    if (!running || !startedAt) return;
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  const pasN = Number(pas) || 0;
  const pesoN = Number(peso) || 70;
  const idadeN = Number(idade) || 60;

  const unstable = instavel(instabilidade, pasN);
  const tipo = classificarTipo(qrsEstreito, rrRegular);
  const wpw = alertaWpw(tipo, !rrRegular);
  const chaScore = cha2ds2vaScore(idadeN, cha);
  const bledScore = hasBledScore(bled);

  const metTeto = avisoTetoDose(metoprololN, METOPROLOL_MAX_DOSES, "Metoprolol");
  const adenosinaWarn =
    adenosinaN >= 3
      ? "Teto de adenosina (3ª dose 12 mg)."
      : adenosinaN === 2
        ? "Próxima dose: 3ª e última de adenosina (12 mg)."
        : null;

  const showEscores = tipo === "fa-flutter" && !unstable;

  const manobrasVagais = tipo === "tsvp" && !unstable;

  return (
    <div className="space-y-4">
      {!running ? (
        <button
          type="button"
          onClick={() => {
            setRunning(true);
            setStartedAt(Date.now());
          }}
          className="rounded-full bg-ocean-800 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Iniciar cronômetro
        </button>
      ) : (
        <p className="font-mono text-2xl font-bold text-navy-950">{formatTimer(elapsedSec)}</p>
      )}

      <ProtocolPanel title="Dados clínicos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            PAS
            <input
              type="number"
              value={pas}
              onChange={(e) => setPas(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            FC
            <input
              type="number"
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Idade
            <input
              type="number"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={qrsEstreito}
              onChange={() => setQrsEstreito(true)}
            />
            QRS estreito
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!qrsEstreito}
              onChange={() => setQrsEstreito(false)}
            />
            QRS largo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={rrRegular}
              onChange={() => setRrRegular(true)}
            />
            R-R regular
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!rrRegular}
              onChange={() => setRrRegular(false)}
            />
            R-R irregular
          </label>
        </div>
      </ProtocolPanel>

      <ProtocolPanel title="Instabilidade hemodinâmica">
        <div className="space-y-2">
          {INSTABILIDADE_LABELS.map((label, i) => (
            <CheckboxField
              key={label}
              label={label}
              checked={instabilidade[i]}
              onChange={(v) => {
                const next = [...instabilidade];
                next[i] = v;
                setInstabilidade(next);
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-navy-800/55">PAS &lt; 90 também classifica como instável.</p>
      </ProtocolPanel>

      {unstable ? (
        <DangerBanner title="Taquiarritmia instável" linkLabel="Abrir PCR" href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto">
          Cardioversão sincronizada imediata. Energias de referência: 50 → 100 → 120 → 150 → 200 J.
        </DangerBanner>
      ) : (
        <InfoBanner>
          <strong>{TIPO_LABEL[tipo]}</strong>
          {manobrasVagais ? " — Manobras vagais indicadas (TSVP estável)." : null}
        </InfoBanner>
      )}

      {wpw ? (
        <DangerBanner title="Alerta — possível WPW / pré-excitação">
          Contraindicar adenosina, betabloqueador, diltiazem/verapamil e digoxina em FA/Flutter ou TV
          com R-R irregular.
        </DangerBanner>
      ) : null}

      {showEscores ? (
        <ProtocolPanel title="CHA₂DS₂-VA (ESC 2024) e HAS-BLED">
          <p className="text-xs text-navy-800/60">
            Idade já entra na pontuação CHA₂DS₂-VA (65–74=1; ≥75=2). Sem ponto por sexo feminino.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {(
                [
                  ["ic", "IC / disfunção VE"],
                  ["has", "Hipertensão"],
                  ["dm", "Diabetes"],
                  ["avc", "AVC/AIT/tromboembolismo (+2)"],
                  ["vascular", "Doença vascular"],
                ] as const
              ).map(([k, label]) => (
                <CheckboxField
                  key={k}
                  label={label}
                  checked={cha[k]}
                  onChange={(v) => setCha((p) => ({ ...p, [k]: v }))}
                />
              ))}
              <p className="text-sm font-semibold text-navy-950">
                CHA₂DS₂-VA: {chaScore} — {cha2ds2vaInterpretacao(chaScore)}
              </p>
            </div>
            <div className="space-y-2">
              {(
                [
                  ["has", "HAS não controlada"],
                  ["renal", "Função renal alterada"],
                  ["hepatica", "Função hepática alterada"],
                  ["avc", "AVC prévio"],
                  ["sangramento", "Sangramento prévio"],
                  ["inr", "INR lábil"],
                  ["idade", "Idade > 65"],
                  ["aas", "AAS/AINE"],
                  ["etilismo", "Etilismo"],
                ] as const
              ).map(([k, label]) => (
                <CheckboxField
                  key={k}
                  label={label}
                  checked={bled[k]}
                  onChange={(v) => setBled((p) => ({ ...p, [k]: v }))}
                />
              ))}
              <p className="text-sm font-semibold text-navy-950">
                HAS-BLED: {bledScore}{" "}
                {bledScore >= 3 ? "(alto risco de sangramento — não contraindica anticoagulação)" : ""}
              </p>
            </div>
          </div>
        </ProtocolPanel>
      ) : null}

      <ProtocolPanel title="Medicações e cardioversão (log de doses)">
        <div className="space-y-2">
          {tipo === "tsvp" && !unstable ? (
            <DoseLogButton
              label={`Adenosina — ${adenosinaN + 1}ª dose`}
              detail={
                adenosinaDoseMg(adenosinaN) !== null
                  ? `${adenosinaDoseMg(adenosinaN)} mg IV rápido (6 → 12 → 12 mg)`
                  : "Teto atingido"
              }
              onClick={() => adenosinaN < 3 && setAdenosinaN((n) => n + 1)}
              disabled={adenosinaN >= 3 || wpw}
              warn={adenosinaWarn}
            />
          ) : null}
          <DoseLogButton
            label={`Metoprolol — ${metoprololN + 1}ª dose`}
            detail={`${METOPROLOL_MG} mg IV (teto ${METOPROLOL_MAX_DOSES} doses = 15 mg)`}
            onClick={() => !metTeto.blocked && setMetoprololN((n) => n + 1)}
            disabled={metTeto.blocked || wpw}
            warn={metTeto.message}
          />
          <DoseLogButton
            label={`Diltiazem — ${diltiazemN + 1}ª dose`}
            detail={`${diltiazemMg(pesoN)} mg em 2 min (0,25×peso; máx. 2 repetições)`}
            onClick={() => diltiazemN < 2 && setDiltiazemN((n) => n + 1)}
            disabled={diltiazemN >= 2 || wpw}
          />
          <DoseLogButton
            label="Amiodarona"
            detail="150 mg / 10 min (teto acumulado 300 mg na 2ª dose); manutenção 1 mg/min × 6 h"
            onClick={() =>
              setAmiodaronaMgTotal((t) => (t >= 300 ? 300 : t === 0 ? 150 : 300))
            }
            warn={amiodaronaMgTotal >= 150 ? "Avaliar teto de 300 mg." : null}
          />
          <DoseLogButton
            label={`Sulfato de magnésio (Torsades) — ${magnesioN + 1}ª`}
            detail="2 g / 10 min (teto 2 repetições)"
            onClick={() => magnesioN < 2 && setMagnesioN((n) => n + 1)}
            disabled={magnesioN >= 2}
          />
          <DoseLogButton
            label={`Cardioversão sincronizada — ${cardioN + 1}º choque`}
            detail={`${CARDIOVERSAO_J[Math.min(cardioN, CARDIOVERSAO_J.length - 1)]} J`}
            onClick={() => setCardioN((n) => n + 1)}
          />
          <p className="text-sm text-navy-800/70">
            Heparina bolus {heparinaBolusUi(pesoN)} UI · Enoxaparina {enoxaparinaMg(pesoN)} mg SC
            12/12h (1×/dia se ClCr &lt; 30)
          </p>
          <p className="text-xs text-navy-800/55">
            Procainamida: 20–50 mg/min até teto {procainamidaTetoMg(pesoN)} mg (17×peso).
          </p>
        </div>
      </ProtocolPanel>

      <Link
        href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto"
        className="text-xs text-ocean-800 underline"
      >
        Instabilidade → PCR
      </Link>
    </div>
  );
}
