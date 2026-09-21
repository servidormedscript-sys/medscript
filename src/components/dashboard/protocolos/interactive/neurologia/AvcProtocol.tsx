"use client";

import { useState } from "react";
import {
  alteplaseMg,
  classificacaoLabel,
  classificarAvc,
  paOk,
  tenecteplaseMg,
  trombectomiaJanela,
} from "@/lib/clinical/protocols/interactive/neurologia/avc/logic";
import { CheckboxField, DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function AvcProtocol() {
  const [minutos, setMinutos] = useState("");
  const [pas, setPas] = useState("");
  const [pad, setPad] = useState("");
  const [glasgow, setGlasgow] = useState("");
  const [hgt, setHgt] = useState("");
  const [nihss, setNihss] = useState("");
  const [aspects, setAspects] = useState("");
  const [peso, setPeso] = useState("");
  const [contra, setContra] = useState(0);
  const [hemorragico, setHemorragico] = useState(false);
  const [ait, setAit] = useState(false);

  const minN = minutos === "" ? null : Number(minutos);
  const pasN = Number(pas) || 0;
  const padN = Number(pad) || 0;
  const pesoN = Number(peso) || 70;
  const glasgowN = Number(glasgow) || 15;
  const hgtN = Number(hgt) || 0;

  const clf = classificarAvc({
    hemorragico,
    ait,
    minutos: minN,
    pas: pasN,
    pad: padN,
  });
  const alt = alteplaseMg(pesoN);
  const tnk = tenecteplaseMg(pesoN);
  const janelaTe = minN != null ? trombectomiaJanela(minN) : null;

  const iotHref = `/dashboard/protocolos-clinicos?category=emergencia&protocol=isr${peso ? `&weight=${pesoN}` : ""}`;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Triagem AVC">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Minutos desde o início
            <input type="number" value={minutos} onChange={(e) => setMinutos(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            PAS
            <input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            PAD
            <input type="number" value={pad} onChange={(e) => setPad(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Glasgow
            <input type="number" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            HGT (mg/dL)
            <input type="number" value={hgt} onChange={(e) => setHgt(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            NIHSS (referência)
            <input type="number" value={nihss} onChange={(e) => setNihss(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            ASPECTS (referência)
            <input type="number" value={aspects} onChange={(e) => setAspects(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">
            Contraindicações à trombólise (contagem)
            <input type="number" min={0} value={contra} onChange={(e) => setContra(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <CheckboxField label="Suspeita de AVC hemorrágico" checked={hemorragico} onChange={setHemorragico} />
        <CheckboxField label="AIT" checked={ait} onChange={setAit} />
      </ProtocolPanel>

      <InfoBanner>
        <strong>{classificacaoLabel(clf)}</strong>
        {!paOk(pasN || null, padN || null) && pasN > 0 ? (
          <span className="mt-1 block">PA fora da meta para reperfusão (PAS &lt;185, PAD &lt;110).</span>
        ) : null}
        {janelaTe === "estendida" && clf === "trombectomia" ? (
          <span className="mt-1 block">
            Trombectomia 6–24 h: janela estendida — exige mismatch (DAWN/DEFUSE-3); referência NIHSS≥6 e ASPECTS≥6.
          </span>
        ) : null}
      </InfoBanner>

      {glasgowN > 0 && glasgowN <= 8 ? (
        <DangerBanner title="Glasgow ≤8 — proteção de via aérea" href={iotHref} linkLabel="Abrir IOT (ISR)" />
      ) : null}
      {pasN >= 185 || padN >= 110 ? (
        <DangerBanner title="PA elevada — controle antes/durante reperfusão isquêmica" />
      ) : null}
      {hgtN > 0 && hgtN < 60 ? <DangerBanner title="Hipoglicemia — corrigir antes de atribuir déficit neurológico" /> : null}
      {hemorragico ? (
        <DangerBanner title="AVC hemorrágico — meta PAS ~140 (130–150); reversão de anticoagulação se indicada" />
      ) : null}

      {clf === "trombolise" || clf === "trombectomia" ? (
        <ProtocolPanel title="Trombolíticos">
          <p className="text-sm">
            Alteplase: <strong>{alt.total} mg</strong> total — bolus {alt.bolus} mg + infusão {alt.infusao} mg/60 min (máx. 90 mg).
          </p>
          <p className="mt-2 text-sm">
            Tenecteplase: <strong>{tnk} mg</strong> bolus único (máx. 25 mg).
          </p>
          <p className="mt-2 text-xs text-navy-800/70">
            Pós-trombólise: PAS &lt;180/105 por 24 h; evitar PAS &lt;140.
          </p>
          {contra > 0 ? (
            <p className="mt-2 text-sm text-amber-900">Revisar {contra} contraindicação(ões) documentada(s) antes de administrar.</p>
          ) : null}
        </ProtocolPanel>
      ) : null}
    </div>
  );
}
