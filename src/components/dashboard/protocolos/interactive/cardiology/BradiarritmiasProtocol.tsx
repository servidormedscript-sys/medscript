"use client";

import { useState } from "react";
import {
  ATROPINA_MAX_DOSES,
  COMPROMISSO_LABELS,
  comprometido,
  type CompromissoKey,
} from "@/lib/clinical/protocols/interactive/cardiology/bradiarritmias/logic";
import { avisoTetoDose } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import {
  CheckboxField,
  DangerBanner,
  DoseLogButton,
  ProtocolPanel,
} from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const initialFlags = (): Record<CompromissoKey, boolean> => ({
  hipotensao: false,
  consciencia: false,
  choque: false,
  dor_toracica: false,
  ic: false,
});

export default function BradiarritmiasProtocol() {
  const [fc, setFc] = useState("");
  const [pas, setPas] = useState("");
  const [peso, setPeso] = useState("");
  const [flags, setFlags] = useState(initialFlags);
  const [atropinaCount, setAtropinaCount] = useState(0);
  const [marcapasso, setMarcapasso] = useState(false);

  const compromisso = comprometido(flags);
  const atropinaTeto = avisoTetoDose(atropinaCount, ATROPINA_MAX_DOSES, "Atropina");

  function toggleFlag(key: CompromissoKey, value: boolean) {
    setFlags((prev) => ({ ...prev, [key]: value }));
  }

  function giveAtropina() {
    if (atropinaCount >= ATROPINA_MAX_DOSES) return;
    setAtropinaCount((c) => c + 1);
  }

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Sinais vitais">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            FC (bpm)
            <input
              type="number"
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            PAS (mmHg)
            <input
              type="number"
              value={pas}
              onChange={(e) => setPas(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2"
            />
          </label>
        </div>
      </ProtocolPanel>

      <ProtocolPanel title="Comprometimento cardiopulmonar">
        <div className="space-y-2">
          {(Object.keys(COMPROMISSO_LABELS) as CompromissoKey[]).map((key) => (
            <CheckboxField
              key={key}
              label={COMPROMISSO_LABELS[key]}
              checked={flags[key]}
              onChange={(v) => toggleFlag(key, v)}
            />
          ))}
        </div>
      </ProtocolPanel>

      {compromisso ? (
        <DangerBanner
          title="Bradicardia sintomática — conduta ativa"
          href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto"
          linkLabel="Abrir PCR em adulto"
        >
          Não atrasar marcapasso transcutâneo/transvenoso se atropina ineficaz.
        </DangerBanner>
      ) : (
        <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-800/70">
          Sem comprometimento: observação, monitorização e investigar causa (medicação, IAM,
          distúrbio eletrolítico).
        </p>
      )}

      {compromisso ? (
        <>
          <ProtocolPanel title="Conduta escalonada">
            <DoseLogButton
              label={`Atropina — dose ${atropinaCount + 1}`}
              detail="1 mg IV bolus — repetir a cada 3–5 min (teto absoluto 3 mg)"
              onClick={giveAtropina}
              disabled={atropinaTeto.blocked}
              warn={atropinaTeto.message}
            />
            <p className="mt-3 text-sm text-navy-800/70">
              <strong>Dopamina:</strong> 5–20 mcg/kg/min (titular perfusão).
            </p>
            <p className="mt-1 text-sm text-navy-800/70">
              <strong>Adrenalina (infusão):</strong> 2–10 mcg/min (dose fixa, não por peso).
            </p>
            <CheckboxField
              label="Marcapasso transcutâneo/transvenoso iniciado"
              checked={marcapasso}
              onChange={setMarcapasso}
              description="Registrar quando disponível — não substituir por doses repetidas de atropina se refratário."
            />
          </ProtocolPanel>
        </>
      ) : null}
    </div>
  );
}
