"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  amiodaronaDoseMg,
  compressionBpm,
  getUiFlags,
  registerCompressionTap,
  ritmoChocavel,
  shouldShowRhythmCheckAlert,
  shouldShowViabilidadeAlert,
} from "@/lib/clinical/protocols/interactive/pcr-adulto/logic";
import {
  REVERSIBLE_CAUSES_ADULT,
  RHYTHM_OPTIONS,
  type RitmoAdulto,
} from "@/lib/clinical/protocols/interactive/pcr-adulto/reversible-causes";

type State = {
  running: boolean;
  startedAt: number | null;
  elapsedSec: number;
  ritmo: RitmoAdulto | null;
  ritmoChecado: boolean;
  choqueDisponivel: boolean;
  posChoque: boolean;
  choques: number;
  adrenalinaCount: number;
  amiodaronaCount: number;
  compressionTimestamps: number[];
  lastRhythmAckSec: number;
  lastViabilidadeAckSec: number;
  rhythmAlertOpen: boolean;
  viabilityAlertOpen: boolean;
  causas: Record<string, boolean>;
  rosc: boolean;
  amiodaronaWarn: boolean;
};

type Action =
  | { type: "START" }
  | { type: "TICK"; elapsedSec: number }
  | { type: "SELECT_RITMO"; ritmo: RitmoAdulto }
  | { type: "SHOCK" }
  | { type: "ADRENALINE" }
  | { type: "AMIODARONE" }
  | { type: "COMPRESSION" }
  | { type: "ACK_RHYTHM" }
  | { type: "ACK_POST_SHOCK" }
  | { type: "ACK_VIABILITY" }
  | { type: "TOGGLE_CAUSA"; id: string }
  | { type: "ROSC" }
  | { type: "RESET" };

const initialState: State = {
  running: false,
  startedAt: null,
  elapsedSec: 0,
  ritmo: null,
  ritmoChecado: false,
  choqueDisponivel: false,
  posChoque: false,
  choques: 0,
  adrenalinaCount: 0,
  amiodaronaCount: 0,
  compressionTimestamps: [],
  lastRhythmAckSec: 0,
  lastViabilidadeAckSec: 0,
  rhythmAlertOpen: false,
  viabilityAlertOpen: false,
  causas: {},
  rosc: false,
  amiodaronaWarn: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        running: true,
        startedAt: Date.now(),
      };
    case "TICK": {
      const rhythmDue = shouldShowRhythmCheckAlert(
        action.elapsedSec,
        state.lastRhythmAckSec
      );
      const viabilityDue = shouldShowViabilidadeAlert(
        action.elapsedSec,
        state.lastViabilidadeAckSec
      );
      return {
        ...state,
        elapsedSec: action.elapsedSec,
        rhythmAlertOpen: state.rhythmAlertOpen || rhythmDue,
        viabilityAlertOpen: state.viabilityAlertOpen || viabilityDue,
      };
    }
    case "SELECT_RITMO": {
      const chocavel = ritmoChocavel(action.ritmo);
      return {
        ...state,
        ritmo: action.ritmo,
        ritmoChecado: true,
        choqueDisponivel: chocavel,
        rhythmAlertOpen: false,
        lastRhythmAckSec: state.elapsedSec,
      };
    }
    case "SHOCK":
      if (!ritmoChocavel(state.ritmo) || !state.choqueDisponivel) return state;
      return {
        ...state,
        choques: state.choques + 1,
        choqueDisponivel: false,
        posChoque: true,
      };
    case "ACK_POST_SHOCK":
      return { ...state, posChoque: false };
    case "ADRENALINE":
      return { ...state, adrenalinaCount: state.adrenalinaCount + 1 };
    case "AMIODARONE": {
      if (!ritmoChocavel(state.ritmo)) return state;
      const next = state.amiodaronaCount + 1;
      return {
        ...state,
        amiodaronaCount: next,
        amiodaronaWarn: next >= 2,
      };
    }
    case "COMPRESSION": {
      const now = Date.now();
      return {
        ...state,
        compressionTimestamps: registerCompressionTap(state.compressionTimestamps, now),
      };
    }
    case "ACK_RHYTHM":
      return {
        ...state,
        rhythmAlertOpen: false,
        lastRhythmAckSec: state.elapsedSec,
      };
    case "ACK_VIABILITY":
      return {
        ...state,
        viabilityAlertOpen: false,
        lastViabilidadeAckSec: state.elapsedSec,
      };
    case "TOGGLE_CAUSA":
      return {
        ...state,
        causas: {
          ...state.causas,
          [action.id]: !state.causas[action.id],
        },
      };
    case "ROSC":
      return { ...state, rosc: true, running: false };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PcrAdultoProtocol() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const rhythmRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!state.running || !state.startedAt) return;
    const id = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - state.startedAt!) / 1000);
      dispatch({ type: "TICK", elapsedSec });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.running, state.startedAt]);

  const flags = useMemo(
    () => getUiFlags(state.ritmo, state.ritmoChecado, state.choqueDisponivel),
    [state.ritmo, state.ritmoChecado, state.choqueDisponivel]
  );

  const compression = useMemo(
    () => compressionBpm(state.compressionTimestamps),
    [state.compressionTimestamps]
  );

  const scrollToRhythm = useCallback(() => {
    rhythmRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const confirmRhythmAlert = () => {
    dispatch({ type: "ACK_RHYTHM" });
    scrollToRhythm();
  };

  if (!mounted) {
    return (
      <p className="text-sm text-navy-800/60">Carregando protocolo interativo…</p>
    );
  }

  if (state.rosc) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">ROSC registrado</p>
        <p className="mt-2 text-sm text-emerald-800/80">
          Cuidados pós-parada: estabilização hemodinâmica, causa da PCR, temperatura e
          gasometria. Tempo total de RCP: {formatTime(state.elapsedSec)}.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="mt-4 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900"
        >
          Novo registro
        </button>
      </div>
    );
  }

  if (!state.running) {
    return (
      <div className="rounded-xl border border-navy-900/10 bg-white p-6">
        <h3 className="text-lg font-semibold text-navy-950">PCR em adulto — modo assistencial</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy-800/70">
          Cronômetro de RCP, checagem de ritmo a cada 2 min, choque, adrenalina, amiodarona
          e causas reversíveis (H&apos;s e T&apos;s). Ritmo é informado manualmente (sem ECG
          automático).
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-navy-800/65">
          <li>Adrenalina 1 mg IV/IO a cada 3–5 min (dose fixa)</li>
          <li>Amiodarona 300 mg → 150 mg (ritmo chocável)</li>
          <li>Choque: bifásico 120–200 J ou monofásico 360 J</li>
        </ul>
        <button
          type="button"
          onClick={() => dispatch({ type: "START" })}
          className="mt-6 rounded-full bg-med-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          Iniciar RCP / cronômetro
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.rhythmAlertOpen ? (
        <div className="animate-pulse rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <p className="font-semibold text-amber-950">Checar ritmo (ciclo de 2 min)</p>
          <p className="mt-1 text-sm text-amber-900/80">
            Pausa breve, analise o ritmo e confirme abaixo.
          </p>
          <button
            type="button"
            onClick={confirmRhythmAlert}
            className="mt-3 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Confirmar checagem de ritmo
          </button>
        </div>
      ) : null}

      {state.viabilityAlertOpen ? (
        <div className="rounded-xl border border-violet-300 bg-violet-50 p-4">
          <p className="font-semibold text-violet-950">Reavaliar viabilidade do esforço</p>
          <p className="mt-1 text-sm text-violet-900/80">
            RCP ≥ 60 min (ou +20 min desde o último aviso). Discuta com a equipe continuar ou
            encerrar esforços.
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "ACK_VIABILITY" })}
            className="mt-3 rounded-full border border-violet-400 bg-white px-4 py-2 text-sm font-medium text-violet-900"
          >
            Equipe ciente — continuar RCP
          </button>
        </div>
      ) : null}

      {state.posChoque ? (
        <div className="rounded-xl border border-ocean-300 bg-ocean-50 p-4">
          <p className="font-semibold text-ocean-950">Após choque: retome RCP agora</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "ACK_POST_SHOCK" })}
            className="mt-2 rounded-full bg-ocean-800 px-4 py-2 text-sm font-semibold text-white"
          >
            RCP retomada
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-navy-900/10 bg-white p-4 text-center md:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/50">
            Tempo de RCP
          </p>
          <p className="mt-2 font-mono text-4xl font-bold text-navy-950">
            {formatTime(state.elapsedSec)}
          </p>
          <p className="mt-2 text-xs text-navy-800/55">
            Choques: {state.choques} · Adrenalina: {state.adrenalinaCount} · Amiodarona:{" "}
            {state.amiodaronaCount}
          </p>
        </div>

        <div className="rounded-xl border border-navy-900/10 bg-white p-4 md:col-span-2">
          <p className="text-sm font-medium text-navy-950">Cadência de compressões</p>
          <p className="mt-1 text-xs text-navy-800/55">
            Toque a cada compressão (janela dos últimos 12 toques). Intervalo &gt;3 s reinicia a
            contagem.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "COMPRESSION" })}
              className="rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-white active:scale-95"
            >
              Compressão
            </button>
            {compression.bpm !== null ? (
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  compression.status === "ok"
                    ? "bg-emerald-100 text-emerald-900"
                    : compression.status === "slow"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-orange-100 text-orange-900"
                }`}
              >
                {compression.bpm}/min
                {compression.status === "ok"
                  ? " — adequado"
                  : compression.status === "slow"
                    ? " — devagar"
                    : " — rápido"}
              </span>
            ) : (
              <span className="text-sm text-navy-800/50">≥4 toques para calcular BPM</span>
            )}
          </div>
        </div>
      </div>

      <div ref={rhythmRef} className="rounded-xl border border-navy-900/10 bg-white p-5">
        <h4 className="text-sm font-semibold text-navy-950">Ritmo atual</h4>
        <p className="mt-1 text-xs text-navy-800/55">
          FV/TV sem pulso = chocável · Assistolia, AESP e bradicardia sem pulso = não chocável
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {RHYTHM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => dispatch({ type: "SELECT_RITMO", ritmo: opt.id })}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                state.ritmo === opt.id
                  ? "border-ocean-700 bg-ocean-800 text-white"
                  : "border-navy-900/12 bg-navy-50/50 hover:border-ocean-300"
              }`}
            >
              <span className="font-semibold">{opt.label}</span>
              <span
                className={`mt-0.5 block text-xs ${
                  state.ritmo === opt.id ? "text-white/80" : "text-navy-800/55"
                }`}
              >
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
        {flags.shockEnabled ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "SHOCK" })}
            className="mt-4 rounded-full bg-med-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Aplicar choque ({state.choques + 1}º)
          </button>
        ) : null}
        {state.ritmo && !ritmoChocavel(state.ritmo) ? (
          <p className="mt-3 text-xs text-navy-800/60">Ritmo não chocável — continue RCP e medicações.</p>
        ) : null}
        {state.ritmo && ritmoChocavel(state.ritmo) && !state.choqueDisponivel && !state.posChoque ? (
          <p className="mt-3 text-xs text-amber-800">
            Confirme o ritmo novamente antes do próximo choque.
          </p>
        ) : null}
      </div>

      {flags.showMedsAndCauses ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-navy-900/10 bg-white p-5">
              <h4 className="text-sm font-semibold text-navy-950">Medicações</h4>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADRENALINE" })}
                className="mt-3 w-full rounded-lg border border-navy-900/10 bg-navy-50/80 px-4 py-3 text-left text-sm hover:border-ocean-300"
              >
                <span className="font-semibold text-navy-950">Adrenalina</span>
                <span className="mt-1 block text-navy-800/70">
                  1 mg IV/IO — repetir a cada 3–5 min (dose {state.adrenalinaCount + 1})
                </span>
              </button>
              {flags.showAmiodarona ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "AMIODARONE" })}
                  disabled={flags.amiodaronaBlocked}
                  className="mt-2 w-full rounded-lg border border-navy-900/10 bg-navy-50/80 px-4 py-3 text-left text-sm hover:border-ocean-300 disabled:opacity-50"
                >
                  <span className="font-semibold text-navy-950">Amiodarona</span>
                  <span className="mt-1 block text-navy-800/70">
                    {amiodaronaDoseMg(state.amiodaronaCount)} mg IV —{" "}
                    {state.amiodaronaCount === 0 ? "1ª dose" : "dose seguinte"}
                  </span>
                  {state.amiodaronaWarn ? (
                    <span className="mt-1 block text-xs text-amber-800">
                      Aviso: múltiplas doses — avalie benefício/risco (não bloqueia repetição).
                    </span>
                  ) : null}
                </button>
              ) : null}
            </div>

            <div className="rounded-xl border border-navy-900/10 bg-white p-5">
              <h4 className="text-sm font-semibold text-navy-950">Conduta imediata</h4>
              <ul className="mt-2 space-y-1 text-sm text-navy-800/70">
                <li>Compressões 100–120/min, minimizar pausas.</li>
                <li>Ventilação 30:2 ou dispositivo avançado.</li>
                <li>Acesso IV/IO; tratar causas reversíveis.</li>
              </ul>
              <button
                type="button"
                onClick={() => dispatch({ type: "ROSC" })}
                className="mt-4 w-full rounded-full border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                Registrar ROSC
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-navy-900/10 bg-white p-5">
            <h4 className="text-sm font-semibold text-navy-950">Causas reversíveis (H&apos;s e T&apos;s)</h4>
            <div className="mt-4 space-y-3">
              {REVERSIBLE_CAUSES_ADULT.map((cause) => (
                <label
                  key={cause.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-navy-900/8 bg-navy-50/40 p-3"
                >
                  <input
                    type="checkbox"
                    checked={!!state.causas[cause.id]}
                    onChange={() => dispatch({ type: "TOGGLE_CAUSA", id: cause.id })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold text-ocean-800">{cause.group}</span>{" "}
                    <span className="text-sm font-medium text-navy-950">{cause.label}</span>
                    <p className="mt-1 text-xs leading-relaxed text-navy-800/65">
                      {cause.treatment}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-navy-900/15 bg-white/80 px-4 py-3 text-sm text-navy-800/60">
          Medicações e causas reversíveis aparecem após a primeira checagem de ritmo.
        </p>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: "RESET" })}
        className="text-xs text-navy-800/45 underline hover:text-navy-800"
      >
        Encerrar e reiniciar protocolo
      </button>
    </div>
  );
}
