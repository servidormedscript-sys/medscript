"use client";

import Link from "next/link";
import { useState } from "react";
import {
  alertaEhh,
  anionGap,
  classificarGlicemia,
  doseInsulinaKg,
  osmolaridade,
} from "@/lib/clinical/protocols/interactive/metabolico/glicemia/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function GlicemiaProtocol() {
  const [hgt, setHgt] = useState("");
  const [glasgow, setGlasgow] = useState("15");
  const [peso, setPeso] = useState("");
  const [idade, setIdade] = useState("");
  const [pediatrico, setPediatrico] = useState(false);
  const [gestante, setGestante] = useState(false);
  const [na, setNa] = useState("");
  const [cl, setCl] = useState("");
  const [hco3, setHco3] = useState("");
  const [ureia, setUreia] = useState("");
  const [historico, setHistorico] = useState<number[]>([]);

  const hgtN = Number(hgt) || 0;
  const glasgowN = Number(glasgow) || 15;
  const pesoN = Number(peso) || 70;
  const idadeN = Number(idade) || 30;
  const clf = classificarGlicemia({ hgt: hgtN, glasgow: glasgowN, gestante });
  const insKg = doseInsulinaKg(pediatrico, idadeN);
  const ag = anionGap(Number(na) || 0, Number(cl) || 0, Number(hco3) || 0);
  const osm = osmolaridade(Number(na) || 0, hgtN, Number(ureia) || 0);
  const ehh = alertaEhh(osm, hgtN);
  const recorrente = historico.filter((x) => x < 70).length >= 2;

  function registrarHgt() {
    if (hgtN <= 0) return;
    setHistorico((h) => [...h.slice(-9), hgtN]);
  }

  const iotHref = "/dashboard/protocolos-clinicos?category=emergencia&protocol=isr";

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Avaliação">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            HGT (mg/dL)
            <input type="number" value={hgt} onChange={(e) => setHgt(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Glasgow
            <input type="number" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Idade
            <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <CheckboxField label="Pediátrico" checked={pediatrico} onChange={setPediatrico} />
        <CheckboxField label="Gestante" checked={gestante} onChange={setGestante} />
        <button type="button" onClick={registrarHgt} className="mt-3 rounded-lg bg-ocean-700 px-4 py-2 text-sm font-semibold text-white">
          Registrar HGT no histórico
        </button>
        {historico.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {historico.map((v, i) => (
              <span
                key={i}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  v < 54 ? "bg-red-200" : v < 70 ? "bg-amber-200" : v > 250 ? "bg-orange-200" : "bg-green-100"
                }`}
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </ProtocolPanel>

      <ProtocolPanel title="Laboratório (opcional)">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Na", na, setNa],
            ["Cl", cl, setCl],
            ["HCO₃", hco3, setHco3],
            ["Ureia", ureia, setUreia],
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
        {ag != null && <p className="mt-2 text-sm">Anion gap: {ag.toFixed(0)} (ref. 8–12)</p>}
        {osm != null && <p className="text-sm">Osmolaridade: {osm.toFixed(0)} mOsm/L{osm > 320 ? " — EHH?" : ""}</p>}
      </ProtocolPanel>

      <InfoBanner>
        Classificação: <strong>{clf.replace(/_/g, " ")}</strong>
        {recorrente && <span className="mt-1 block text-amber-900">≥2 HGT &lt;70 no histórico — revisar esquema insulínico / IR / internação.</span>}
      </InfoBanner>

      {glasgowN <= 8 && (
        <DangerBanner title="Glasgow ≤8" href={iotHref} linkLabel="Abrir IOT" />
      )}

      <ProtocolPanel title="Conduta">
        {clf === "hipo_grave" && (
          <p className="text-sm">
            {pediatrico
              ? `Glicose 25% ${(pesoN * 0.5).toFixed(0)} g EV; glucagon IM ${pesoN < 25 ? "0,5" : "1"} mg ou nasal 3 mg.`
              : "Glicose 50% 25 mL EV; glucagon IM 1 mg ou nasal 3 mg."}
            {gestante && !pediatrico ? " (Gestante: limiar hipo 60 mg/dL.)" : ""}
          </p>
        )}
        {clf === "hipo_mod" && (
          <p className="text-sm">
            Regra 15/15: {pediatrico ? `${(pesoN * 0.3).toFixed(0)} g VO` : gestante ? "20 g VO" : "15 g VO"}.
          </p>
        )}
        {(clf === "hiper_importante" || clf === "hiper_grave") && (
          <p className="text-sm">
            SF {pediatrico ? "10–20 mL/kg 1ª h" : clf === "hiper_grave" ? "1000 mL 1ª h depois 500 mL/h" : "500–1000 mL"}; insulina{" "}
            {(pesoN * (ehh ? insKg / 2 : insKg)).toFixed(1)} UI/h ({ehh ? "EHH: metade da dose CAD, sem bolus" : `${insKg} UI/kg/h, sem bolus`}).
          </p>
        )}
        {clf === "hiper_grave" && (
          <Link href="/dashboard/protocolos-clinicos?category=metabolico&protocol=cad" className="mt-2 inline-block text-sm text-ocean-800 underline">
            Abrir Cetoacidose Diabética
          </Link>
        )}
      </ProtocolPanel>
    </div>
  );
}
