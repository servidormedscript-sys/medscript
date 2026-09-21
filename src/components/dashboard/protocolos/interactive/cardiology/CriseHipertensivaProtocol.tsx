"use client";

import { useState } from "react";
import {
  classificarHta,
  META_POR_SUBTIPO,
  subtipoEmergencia,
  temLOA,
} from "@/lib/clinical/protocols/interactive/cardiology/crise-hipertensiva/logic";
import { CheckboxField, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const LOA_LABELS = [
  "Déficit neurológico focal",
  "Edema agudo de pulmão",
  "Dissecção aórtica suspeita",
  "Encefalopatia hipertensiva",
  "Lesão renal aguda / oligúria",
  "Síndrome coronariana aguda",
];

export default function CriseHipertensivaProtocol() {
  const [pas, setPas] = useState("");
  const [pad, setPad] = useState("");
  const [idade, setIdade] = useState("60");
  const [peso, setPeso] = useState("");
  const [loa, setLoa] = useState([false, false, false, false, false, false]);
  const [gestante, setGestante] = useState(false);
  const [renal, setRenal] = useState(false);
  const [asma, setAsma] = useState(false);
  const [sub, setSub] = useState({
    dorToracica: false,
    dorAbdominal: false,
    deficit: false,
    cefaleia: false,
    visual: false,
    dispneia: false,
  });

  const pasN = Number(pas) || 0;
  const padN = Number(pad) || 0;
  const idadeN = Number(idade) || 60;
  const classif = classificarHta(pasN, padN, temLOA(loa));
  const subtipo =
    classif === "emergencia"
      ? subtipoEmergencia({ ...sub, gestante })
      : null;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Pressão e contexto">
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm">
            PAS
            <input value={pas} onChange={(e) => setPas(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" type="number" />
          </label>
          <label className="text-sm">
            PAD
            <input value={pad} onChange={(e) => setPad(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" type="number" />
          </label>
          <label className="text-sm">
            Idade
            <input value={idade} onChange={(e) => setIdade(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" type="number" />
          </label>
          <label className="text-sm">
            Peso
            <input value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" type="number" />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          <CheckboxField label="Gestante" checked={gestante} onChange={setGestante} />
          <CheckboxField label="Doença renal" checked={renal} onChange={setRenal} />
          <CheckboxField label="Asma / DPOC" checked={asma} onChange={setAsma} />
        </div>
      </ProtocolPanel>

      <ProtocolPanel title="Lesão de órgão-alvo (LOA)">
        {LOA_LABELS.map((label, i) => (
          <CheckboxField
            key={label}
            label={label}
            checked={loa[i]}
            onChange={(v) => {
              const n = [...loa];
              n[i] = v;
              setLoa(n);
            }}
          />
        ))}
      </ProtocolPanel>

      <InfoBanner>
        Classificação: <strong>{classif.toUpperCase()}</strong>
        {classif === "emergencia" && subtipo ? (
          <>
            {" "}
            · Subtipo: <strong>{subtipo}</strong> — Meta: {META_POR_SUBTIPO[subtipo]}
          </>
        ) : null}
      </InfoBanner>

      {classif === "emergencia" ? (
        <ProtocolPanel title="Subtipo (prioridade clínica)">
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxField label="Dor torácica" checked={sub.dorToracica} onChange={(v) => setSub((p) => ({ ...p, dorToracica: v }))} />
            <CheckboxField label="Dor abdominal" checked={sub.dorAbdominal} onChange={(v) => setSub((p) => ({ ...p, dorAbdominal: v }))} />
            <CheckboxField label="Déficit focal" checked={sub.deficit} onChange={(v) => setSub((p) => ({ ...p, deficit: v }))} />
            <CheckboxField label="Cefaleia" checked={sub.cefaleia} onChange={(v) => setSub((p) => ({ ...p, cefaleia: v }))} />
            <CheckboxField label="Alteração visual" checked={sub.visual} onChange={(v) => setSub((p) => ({ ...p, visual: v }))} />
            <CheckboxField label="Dispneia / EAP" checked={sub.dispneia} onChange={(v) => setSub((p) => ({ ...p, dispneia: v }))} />
          </div>
        </ProtocolPanel>
      ) : null}

      <ProtocolPanel title="Condutas medicamentosas (referência)">
        <ul className="space-y-2 text-sm text-navy-800/75">
          <li>Dissecção: Esmolol 0,5 mg/kg; Nitroprussiato 0,3 mcg/kg/min (máx. 10).</li>
          <li>Labetalol 20 mg / 2 min → 20–80 mg / 10 min (máx. 300 mg).</li>
          <li>Nicardipina 5 mg/h + 2,5 mg/h a cada 5 min (máx. 15 mg/h).</li>
          <li>Hidralazina 5–10 mg / 20 min (máx. 20 mg; pré-eclâmpsia).</li>
          <li>MgSO₄ 4–6 g / 15–20 min + 1–2 g/h (pré-eclâmpsia).</li>
          <li className="pt-2 font-medium">Urgência (VO): Captopril 25–50 mg; Clonidina 0,1–0,2 mg; Anlodipino 5–10 mg; Losartana 50–100 mg.</li>
        </ul>
        {gestante ? <p className="mt-2 text-xs text-amber-800">Evitar IECA/BRA; preferir Hidralazina, Labetalol, Metildopa.</p> : null}
        {renal ? <p className="text-xs text-amber-800">Evitar nitroprussiato.</p> : null}
        {asma ? <p className="text-xs text-amber-800">Evitar betabloqueador.</p> : null}
        {idadeN > 65 ? <p className="text-xs text-navy-800/60">Idoso: redução mais gradual (exceto dissecção/AVC).</p> : null}
      </ProtocolPanel>
    </div>
  );
}
