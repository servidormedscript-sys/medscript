"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CIWA_LABELS,
  CIWA_MAX,
  ciwaTotal,
  DIAZEPAM_REF_MAX,
  gravidadeCiwa,
  alertaUti,
  LORAZEPAM_REF_MAX,
  TIAMINA_ESQUEMA,
  tratarFarmacologicamente,
} from "@/lib/clinical/protocols/interactive/saude-mental/abstinencia/logic";
import { avisoTetoDose } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import { CheckboxField, DangerBanner, DoseLogButton, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AbstinenciaProtocol() {
  const [scores, setScores] = useState(() => CIWA_LABELS.map(() => 0));
  const [wernicke, setWernicke] = useState(false);
  const [diazCount, setDiazCount] = useState(0);
  const [diazRefCount, setDiazRefCount] = useState(0);
  const [lorRefCount, setLorRefCount] = useState(0);
  const [fenobarbCount, setFenobarbCount] = useState(0);
  const [tiaminaCount, setTiaminaCount] = useState(0);

  const total = ciwaTotal(scores);
  const grav = gravidadeCiwa(total);
  const tratar = tratarFarmacologicamente(total);
  const uti = alertaUti(total, wernicke);
  const diazRefTeto = avisoTetoDose(diazRefCount, DIAZEPAM_REF_MAX, "Diazepam EV (incrementos refratário)");
  const lorRefTeto = avisoTetoDose(lorRefCount, LORAZEPAM_REF_MAX, "Lorazepam EV (incrementos refratário)");

  return (
    <div className="space-y-4">
      <ProtocolPanel title="CIWA-Ar (0–67)">
        {CIWA_LABELS.map((label, i) => (
          <label key={label} className="mt-2 flex items-center justify-between gap-4 text-sm">
            <span className="flex-1">{label}</span>
            <select
              value={scores[i]}
              onChange={(e) => {
                const n = [...scores];
                n[i] = Number(e.target.value);
                setScores(n);
              }}
              className="rounded border px-2 py-1"
            >
              {Array.from({ length: CIWA_MAX[i] + 1 }, (_, v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
        <CheckboxField label="Suspeita / confirmação de Wernicke" checked={wernicke} onChange={setWernicke} />
        <p className="mt-3 text-lg font-semibold">Total: {total}</p>
      </ProtocolPanel>

      <InfoBanner>
        Gravidade: <strong>{grav.toUpperCase()}</strong>
        {!tratar && " — Observação, reavaliar 1–2 h, sem BZD."}
        {tratar && total <= 15 && " — BZD + reavaliar a cada 1 h (ASAM 2020). Meta RASS 0 a -2."}
        {total > 15 && " — Grave / DT iminente."}
      </InfoBanner>

      {uti && (
        <DangerBanner title="Considerar UTI / monitorização intensiva">
          <Link href="/dashboard/protocolos-clinicos?category=neurologia&protocol=crise-convulsiva" className="text-red-800 underline">
            Crise convulsiva
          </Link>
        </DangerBanner>
      )}

      {tratar && (
        <ProtocolPanel title="Medicações (registro)">
          <p className="text-sm">Diazepam inicial: 10–20 mg VO/EV.</p>
          <DoseLogButton
            label="Diazepam (dose inicial)"
            detail="10–20 mg"
            onClick={() => setDiazCount((c) => c + 1)}
          />
          <DoseLogButton
            label="Diazepam EV refratário (+10–20 mg/10–15 min)"
            detail={`Incrementos; ref. cumulativo 100–150 mg · registrado ×${diazRefCount}`}
            onClick={() => !diazRefTeto.blocked && setDiazRefCount((c) => c + 1)}
            disabled={diazRefTeto.blocked}
            warn={diazRefTeto.message}
          />
          <DoseLogButton
            label="Lorazepam EV refratário (+2–4 mg/10–15 min)"
            detail={`Ref. cumulativo ~30 mg · registrado ×${lorRefCount}`}
            onClick={() => !lorRefTeto.blocked && setLorRefCount((c) => c + 1)}
            disabled={lorRefTeto.blocked}
            warn={lorRefTeto.message}
          />
          <DoseLogButton
            label="Fenobarbital 65–260 mg"
            detail="Se refratário a BZD, repetir até meta RASS 0 a -2"
            onClick={() => setFenobarbCount((c) => c + 1)}
          />
          <p className="mt-3 text-sm">
            Tiamina: {wernicke ? TIAMINA_ESQUEMA.wernickeAtaque : TIAMINA_ESQUEMA.semWernicke}
          </p>
          <DoseLogButton label="Registrar dose de tiamina" detail="Conforme esquema acima" onClick={() => setTiaminaCount((c) => c + 1)} />
          {(diazCount > 0 || fenobarbCount > 0 || tiaminaCount > 0) && (
            <p className="mt-2 text-xs text-navy-800/60">
              Log: diazepam inicial ×{diazCount}, fenobarbital ×{fenobarbCount}, tiamina ×{tiaminaCount}
            </p>
          )}
        </ProtocolPanel>
      )}
    </div>
  );
}
