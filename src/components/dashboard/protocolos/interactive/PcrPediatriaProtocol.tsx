"use client";

import { useEffect, useReducer, useState } from "react";
import { weightBasedDose, formatMg } from "@/lib/clinical/protocols/dose-utils";
import { CheckboxField, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

type State = { running: boolean; elapsedSec: number; shocks: number; adrenaline: number };

function reducer(state: State, action: { type: string }): State {
  switch (action.type) {
    case "START":
      return { running: true, elapsedSec: 0, shocks: 0, adrenaline: 0 };
    case "TICK":
      return state.running ? { ...state, elapsedSec: state.elapsedSec + 1 } : state;
    case "SHOCK":
      return { ...state, shocks: state.shocks + 1 };
    case "ADRENALINE":
      return { ...state, adrenaline: state.adrenaline + 1 };
    case "RESET":
      return { running: false, elapsedSec: 0, shocks: 0, adrenaline: 0 };
    default:
      return state;
  }
}

const CAUSAS = [
  "Hipoxia",
  "Hipovolemia",
  "Hipo/hipertermia",
  "H+ (acidose)",
  "Hipo/hipercalemia",
  "Tóxicos",
  "Tensão pneumotórax",
  "Tromboembolia",
];

export default function PcrPediatriaProtocol() {
  const [state, dispatch] = useReducer(reducer, {
    running: false,
    elapsedSec: 0,
    shocks: 0,
    adrenaline: 0,
  });
  const [peso, setPeso] = useState("20");
  const [causas, setCausas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  const w = Number(peso) || 20;
  const j2 = Math.round(w * 2);
  const j4 = Math.round(w * 4);
  const adren = formatMg(weightBasedDose(w, 0.01, 1));
  const nextJ = state.shocks === 0 ? j2 : j4;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="RCP pediátrica">
        <label className="text-sm">
          Peso (kg)
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2"
          />
        </label>
        <p className="mt-2 text-sm">Relação compressão:ventilação 15:2 (2 socorristas) ou 30:2.</p>
        <p className="text-2xl font-bold tabular-nums text-navy-950">
          {Math.floor(state.elapsedSec / 60)}:{String(state.elapsedSec % 60).padStart(2, "0")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!state.running ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "START" })}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white"
            >
              Iniciar RCP
            </button>
          ) : (
            <>
              <button type="button" onClick={() => dispatch({ type: "SHOCK" })} className="rounded-lg border px-3 py-2 text-sm">
                Choque ({state.shocks + 1}º) — {nextJ} J
              </button>
              <button type="button" onClick={() => dispatch({ type: "ADRENALINE" })} className="rounded-lg border px-3 py-2 text-sm">
                Adrenalina ({adren})
              </button>
              <button type="button" onClick={() => dispatch({ type: "RESET" })} className="rounded-lg border px-3 py-2 text-sm">
                Parar
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-navy-800/60">Adrenalina registrada: {state.adrenaline}× (a cada 3–5 min)</p>
      </ProtocolPanel>
      <ProtocolPanel title="Causas reversíveis">
        {CAUSAS.map((c) => (
          <CheckboxField
            key={c}
            label={c}
            checked={causas[c] ?? false}
            onChange={(v) => setCausas((p) => ({ ...p, [c]: v }))}
          />
        ))}
      </ProtocolPanel>
    </div>
  );
}
