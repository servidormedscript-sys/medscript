"use client";

import Link from "next/link";
import { useState } from "react";
import {
  diureseAdequada,
  estabilizado,
  furosemidaMg,
  morfinaMg,
  perfilEap,
  suporteVentilatorio,
} from "@/lib/clinical/protocols/interactive/cardiology/eap/logic";
import {
  CheckboxField,
  InfoBanner,
  ProtocolPanel,
  DoseLogButton,
} from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function EapProtocol() {
  const [pas, setPas] = useState("");
  const [spo2, setSpo2] = useState("");
  const [fr, setFr] = useState("");
  const [glasgow, setGlasgow] = useState("15");
  const [peso, setPeso] = useState("");
  const [creatinina, setCreatinina] = useState("");
  const [gestante, setGestante] = useState(false);
  const [vasoativosEmUso, setVasoativosEmUso] = useState(false);
  const [melhoraDispneia, setMelhoraDispneia] = useState(false);
  const [diureseMlKgH, setDiureseMlKgH] = useState("");
  const [furoCount, setFuroCount] = useState(0);
  const [morfCount, setMorfCount] = useState(0);

  const pasN = Number(pas) || 0;
  const pesoN = Number(peso) || 70;
  const spo2N = Number(spo2) || 0;
  const frN = Number(fr) || 0;
  const gN = Number(glasgow) || 15;
  const diureseN = Number(diureseMlKgH) || 0;

  const perfil = pasN ? perfilEap(pasN) : null;
  const vent = suporteVentilatorio(spo2N, frN, gN);
  const ok = estabilizado(
    frN,
    spo2N,
    pasN,
    vasoativosEmUso,
    melhoraDispneia,
    diureseAdequada(diureseN)
  );

  const perfilLabel = {
    "frio-umido-grave": "Frio-Úmido / Grave (choque cardiogênico)",
    "quente-umido-grave": "Quente-Úmido / Grave (hipertensivo)",
    "quente-umido-mod": "Quente-Úmido / Moderado",
  };

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Avaliação">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["PAS", pas, setPas],
            ["SpO₂ (%)", spo2, setSpo2],
            ["FR", fr, setFr],
            ["Glasgow", glasgow, setGlasgow],
            ["Peso (kg)", peso, setPeso],
            ["Creatinina", creatinina, setCreatinina],
          ].map(([l, v, set]) => (
            <label key={l as string} className="text-sm">
              {l as string}
              <input
                type="number"
                value={v as string}
                onChange={(e) => (set as (s: string) => void)(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
          ))}
        </div>
        <CheckboxField label="Gestante" checked={gestante} onChange={setGestante} />
        {gestante ? (
          <p className="mt-2 text-xs text-amber-800">
            Evitar nitroprussiato e IECA/BRA; nitroglicerina e furosemida seguras.
          </p>
        ) : null}
      </ProtocolPanel>

      {perfil ? (
        <InfoBanner>
          Perfil hemodinâmico: <strong>{perfilLabel[perfil]}</strong>
        </InfoBanner>
      ) : null}

      {vent === "iot" ? (
        <InfoBanner>
          Indicação de IOT (Glasgow ≤ 8 ou hipoxemia grave).{" "}
          <Link
            href={`/dashboard/protocolos-clinicos?category=emergencia&protocol=isr${peso ? "" : ""}`}
            className="font-semibold underline"
          >
            Abrir IOT — peso {pesoN} kg repassado manualmente
          </Link>
        </InfoBanner>
      ) : vent === "atencao-vni" ? (
        <InfoBanner>Glasgow 9–12: atenção à via aérea / considerar VNI.</InfoBanner>
      ) : null}

      <ProtocolPanel title="Tratamento (contador de doses)">
        <DoseLogButton
          label={`Furosemida — ${furoCount + 1}ª dose`}
          detail={`${furosemidaMg(pesoN)} mg IV (1 mg/kg, piso 40, teto 80)${
            Number(creatinina) > 1.5 ? " — creatinina >1,5: não reduzir dose" : ""
          }`}
          onClick={() => setFuroCount((c) => c + 1)}
        />
        <DoseLogButton
          label={`Morfina — ${morfCount + 1}ª dose`}
          detail={`${morfinaMg(pesoN)} mg IV (0,1 mg/kg, piso 2, teto 4) — reduzir 50% em idoso/IR`}
          onClick={() => setMorfCount((c) => c + 1)}
        />
        <ul className="mt-3 space-y-1 text-sm text-navy-800/70">
          <li>Dobutamina 2,5 mcg/kg/min (até 10) — perfil frio-úmido.</li>
          <li>Milrinona 0,375 mcg/kg/min (até 0,75).</li>
          <li>Noradrenalina 0,1 mcg/kg/min (até 1,0) se PAS &lt; 90.</li>
        </ul>
      </ProtocolPanel>

      <ProtocolPanel title="Critérios de estabilização">
        <CheckboxField
          label="Sem vasoativos em uso"
          checked={!vasoativosEmUso}
          onChange={(v) => setVasoativosEmUso(!v)}
        />
        <CheckboxField label="Melhora da dispneia" checked={melhoraDispneia} onChange={setMelhoraDispneia} />
        <label className="mt-2 block text-sm">
          Diurese (mL/kg/h)
          <input
            type="number"
            step="0.1"
            value={diureseMlKgH}
            onChange={(e) => setDiureseMlKgH(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        {ok ? (
          <p className="mt-3 font-semibold text-emerald-800">
            Paciente estável (FR &lt;20, SpO₂ &gt;92%, PAS 100–140, diurese &gt;0,5 mL/kg/h).
          </p>
        ) : (
          <p className="mt-3 text-sm text-navy-800/60">Ainda não preenche todos os critérios.</p>
        )}
      </ProtocolPanel>
    </div>
  );
}
