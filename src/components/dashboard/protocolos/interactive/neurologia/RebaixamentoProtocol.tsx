"use client";

import Link from "next/link";
import { useState } from "react";
import {
  classificarGlasgow,
  glicoseEvMl,
  NALOXONA_TETO_DOSES,
} from "@/lib/clinical/protocols/interactive/neurologia/rebaixamento/logic";
import { avisoTetoDose } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import { CheckboxField, DangerBanner, DoseLogButton, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function RebaixamentoProtocol() {
  const [glasgow, setGlasgow] = useState("");
  const [hgt, setHgt] = useState("");
  const [pas, setPas] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [peso, setPeso] = useState("");
  const [pediatrico, setPediatrico] = useState(false);
  const [etilista, setEtilista] = useState(false);
  const [opioide, setOpioide] = useState(false);
  const [naloxonaN, setNaloxonaN] = useState(0);
  const [glicoseN, setGlicoseN] = useState(0);

  const gN = Number(glasgow) || 15;
  const hgtN = Number(hgt) || 0;
  const pasN = Number(pas) || 0;
  const spo2N = Number(spo2) || 0;
  const tempN = Number(temp) || 0;
  const pesoN = Number(peso) || 70;
  const grau = classificarGlasgow(gN);
  const naloxTeto = avisoTetoDose(naloxonaN, NALOXONA_TETO_DOSES, "Naloxona (registros)");

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Avaliação">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Glasgow", glasgow, setGlasgow],
            ["HGT", hgt, setHgt],
            ["PAS", pas, setPas],
            ["SpO₂", spo2, setSpo2],
            ["Temperatura", temp, setTemp],
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
        <CheckboxField label="Etilista" checked={etilista} onChange={setEtilista} />
        <CheckboxField label="Suspeita de opioide" checked={opioide} onChange={setOpioide} />
      </ProtocolPanel>

      <InfoBanner>
        Grau: <strong>{grau.toUpperCase()}</strong> (Glasgow {gN})
      </InfoBanner>

      {gN <= 8 && (
        <DangerBanner title="IOT indicada" href="/dashboard/protocolos-clinicos?category=emergencia&protocol=isr" linkLabel="Abrir IOT" />
      )}
      {hgtN > 0 && hgtN < 70 && (
        <DangerBanner title="Hipoglicemia — glicose IV imediata">
          {etilista ? " Associar tiamina antes/ com glicose." : null}
        </DangerBanner>
      )}
      {pasN >= 180 && (
        <DangerBanner title="HAS grave">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=crise-hipertensiva" className="text-red-800 underline">
            Crise hipertensiva
          </Link>
        </DangerBanner>
      )}
      {spo2N > 0 && spo2N < 90 && <DangerBanner title="Hipoxemia — oxigenoterapia / via aérea" />}
      {tempN >= 38 && <DangerBanner title="Febre — investigar foco infeccioso" />}

      <ProtocolPanel title="Coma cocktail / reversão">
        <DoseLogButton
          label="Registrar glicose EV"
          detail={glicoseEvMl(pesoN, pediatrico)}
          onClick={() => setGlicoseN((c) => c + 1)}
        />
        {opioide && (
          <div className="mt-3">
            <DoseLogButton
              label="Registrar naloxona 0,4–2 mg"
              detail="Repetir 2–3 min; máx. cumulativo 10 mg"
              onClick={() => !naloxTeto.blocked && setNaloxonaN((c) => c + 1)}
              disabled={naloxTeto.blocked}
              warn={naloxTeto.message ?? (naloxonaN >= 4 ? "Aviso: 5ª dose registrada — revisar teto cumulativo." : null)}
            />
          </div>
        )}
        <p className="mt-3 text-sm text-amber-900">
          Flumazenil: não usar empiricamente em coma indiferenciado (risco de convulsão).
        </p>
        {(glicoseN > 0 || naloxonaN > 0) && (
          <p className="mt-2 text-xs text-navy-800/60">
            Log: glicose ×{glicoseN}, naloxona ×{naloxonaN}
          </p>
        )}
      </ProtocolPanel>
    </div>
  );
}
