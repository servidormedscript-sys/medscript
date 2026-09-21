"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ACIDO_TRANEXAMICO_MAX_DOSES,
  classificarObst,
  HIDRALAZINA_MAX_DOSES,
  hipertensaoGestacional,
  LABETALOL_MAX_DOSES,
  precisaMg,
  type CriterioGravidadeKey,
} from "@/lib/clinical/protocols/interactive/obstetricia/obst/logic";
import { avisoTetoDose } from "@/lib/clinical/protocols/interactive/shared/dose-helpers";
import { CheckboxField, DangerBanner, DoseLogButton, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const CRITERIOS: { key: CriterioGravidadeKey; label: string }[] = [
  { key: "pas160", label: "PAS ≥160" },
  { key: "pad110", label: "PAD ≥110" },
  { key: "plaquetas", label: "Plaquetas <100.000" },
  { key: "creatinina", label: "Creatinina elevada" },
  { key: "tgo", label: "TGO elevada" },
  { key: "eap", label: "EAP" },
  { key: "cefaleia", label: "Cefaleia / alteração visual" },
  { key: "dor_epigastrica", label: "Dor epigástrica / HD" },
  { key: "convulsao", label: "Convulsão" },
];

export default function ObstProtocol() {
  const [aba, setAba] = useState<"pe" | "hpp">("pe");
  const [ig, setIg] = useState("");
  const [pas, setPas] = useState("");
  const [pad, setPad] = useState("");
  const [proteinuria, setProteinuria] = useState(false);
  const [eclampsia, setEclampsia] = useState(false);
  const [crit, setCrit] = useState<Record<CriterioGravidadeKey, boolean>>({
    pas160: false,
    pad110: false,
    plaquetas: false,
    creatinina: false,
    tgo: false,
    eap: false,
    cefaleia: false,
    dor_epigastrica: false,
    convulsao: false,
  });
  const [fc, setFc] = useState("");
  const [hppCausas, setHppCausas] = useState({ tonus: false, trauma: false, tecido: false, trombina: false });
  const [hidralazinaN, setHidralazinaN] = useState(0);
  const [labetalolN, setLabetalolN] = useState(0);
  const [txaN, setTxaN] = useState(0);

  const pasN = Number(pas) || 0;
  const padN = Number(pad) || 0;
  const fcN = Number(fc) || 0;
  const ht = hipertensaoGestacional(pasN, padN);
  const classif = classificarObst({
    eclampsia,
    gravidade: crit,
    hipertensao: ht,
    proteinuria,
  });
  const mg = precisaMg(classif);
  const hidraTeto = avisoTetoDose(hidralazinaN, HIDRALAZINA_MAX_DOSES, "Hidralazina");
  const labTeto = avisoTetoDose(labetalolN, LABETALOL_MAX_DOSES, "Labetalol");
  const txaTeto = avisoTetoDose(txaN, ACIDO_TRANEXAMICO_MAX_DOSES, "Ácido tranexâmico");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setAba("pe")} className={`rounded-full px-4 py-2 text-sm font-semibold ${aba === "pe" ? "bg-ocean-700 text-white" : "bg-navy-50"}`}>
          Pré-eclâmpsia / Eclâmpsia
        </button>
        <button type="button" onClick={() => setAba("hpp")} className={`rounded-full px-4 py-2 text-sm font-semibold ${aba === "hpp" ? "bg-ocean-700 text-white" : "bg-navy-50"}`}>
          Hemorragia pós-parto
        </button>
      </div>

      {aba === "pe" && (
        <>
          <ProtocolPanel title="Pré-eclâmpsia">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Idade gestacional (sem)
                <input type="number" value={ig} onChange={(e) => setIg(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="text-sm">
                PAS / PAD
                <div className="mt-1 flex gap-2">
                  <input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="PAS" />
                  <input type="number" value={pad} onChange={(e) => setPad(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="PAD" />
                </div>
              </label>
            </div>
            <CheckboxField label="Proteinúria" checked={proteinuria} onChange={setProteinuria} />
            <CheckboxField label="Eclâmpsia (convulsão)" checked={eclampsia} onChange={setEclampsia} />
            {CRITERIOS.map(({ key, label }) => (
              <CheckboxField key={key} label={label} checked={crit[key]} onChange={(v) => setCrit((p) => ({ ...p, [key]: v }))} />
            ))}
          </ProtocolPanel>

          <InfoBanner>
            Classificação: <strong>{classif.replace(/_/g, " ").toUpperCase()}</strong>
            {(pasN >= 160 || padN >= 110) && " · Anti-hipertensivo agudo se PAS≥160/PAD≥110 (meta &lt;160/110)."}
          </InfoBanner>

          {mg && (
            <ProtocolPanel title="Sulfato de magnésio (Zuspan)">
              <p className="text-sm">Ataque 4–6 g/20–30 min; manutenção 1–2 g/h ×24 h após parto/última convulsão.</p>
              <p className="mt-1 text-xs">Monitorar reflexo patelar, FR&gt;12, diurese &gt;25 mL/h; antídoto: gluconato Ca 10% 10 mL/3 min.</p>
            </ProtocolPanel>
          )}

          <ProtocolPanel title="Anti-hipertensivos (contador)">
            <DoseLogButton label="Hidralazina 5–10 mg" detail="Máx. 20 mg; teto 3 doses" onClick={() => !hidraTeto.blocked && setHidralazinaN((c) => c + 1)} disabled={hidraTeto.blocked} warn={hidraTeto.message} />
            <DoseLogButton label="Labetalol 20 mg" detail="Dobrar até 80 mg; máx. 300 mg; teto 5 doses" onClick={() => !labTeto.blocked && setLabetalolN((c) => c + 1)} disabled={labTeto.blocked} warn={labTeto.message} />
            <p className="mt-2 text-sm">Nifedipina VO: 10 mg, repetir 20 min.</p>
          </ProtocolPanel>
        </>
      )}

      {aba === "hpp" && (
        <>
          <ProtocolPanel title="HPP — 4 Ts">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                PAS
                <input type="number" value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="text-sm">
                FC
                <input type="number" value={fc} onChange={(e) => setFc(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>
            {(["tonus", "trauma", "tecido", "trombina"] as const).map((k, i) => (
              <CheckboxField
                key={k}
                label={["Tônus uterino", "Trauma", "Tecido retido", "Trombina/coagulopatia"][i]}
                checked={hppCausas[k]}
                onChange={(v) => setHppCausas((p) => ({ ...p, [k]: v }))}
              />
            ))}
            <CheckboxField label="EAP associado" checked={crit.eap} onChange={(v) => setCrit((p) => ({ ...p, eap: v }))} />
          </ProtocolPanel>

          {(pasN < 90 || fcN > 120) && (
            <DangerBanner title="Instabilidade hemodinâmica" href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico" linkLabel="Choque hemorrágico" />
          )}
          {crit.eap && (
            <DangerBanner title="EAP">
              <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=edema-pulmao" className="text-red-800 underline">
                Edema agudo de pulmão
              </Link>
            </DangerBanner>
          )}

          <ProtocolPanel title="Conduta HPP">
            <p className="text-sm">Ocitocina EV 10–40 UI/500–1000 mL (1ª linha).</p>
            <DoseLogButton label="Ácido tranexâmico 1 g" detail="Repetir 1 g se sangramento em 30 min (teto 2 g)" onClick={() => !txaTeto.blocked && setTxaN((c) => c + 1)} disabled={txaTeto.blocked} warn={txaTeto.message} />
            <p className="mt-2 text-sm">Metilergometrina 0,2 mg IM (CI HAS/PE); misoprostol retal 800 mcg se refratário.</p>
          </ProtocolPanel>
        </>
      )}
    </div>
  );
}
