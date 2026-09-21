"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ajusteDoseClCr,
  ckdEpi2021,
  cockcroftGault,
  estagioDrc,
} from "@/lib/clinical/tools/renal/logic";
import { InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function RenalTool() {
  const params = useSearchParams();
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [creat, setCreat] = useState("");
  const [feminino, setFeminino] = useState(false);

  useEffect(() => {
    const w = params.get("weight");
    const a = params.get("age");
    if (w && !peso) setPeso(w);
    if (a && !idade) setIdade(a);
  }, [params, peso, idade]);

  const idadeN = Number(idade) || 0;
  const pesoN = Number(peso) || 0;
  const creatN = Number(creat) || 0;
  const clcr = cockcroftGault(idadeN, pesoN, creatN, feminino);
  const tfge = ckdEpi2021(creatN, idadeN, feminino);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="Função renal">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Idade
            <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Creatinina (mg/dL)
            <input type="number" step="0.01" value={creat} onChange={(e) => setCreat(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={feminino} onChange={(e) => setFeminino(e.target.checked)} />
            Sexo feminino
          </label>
        </div>
      </ProtocolPanel>
      {clcr != null && tfge != null && (
        <>
          <InfoBanner>
            <p>
              Cockcroft-Gault: <strong>{clcr} mL/min</strong> — {ajusteDoseClCr(clcr)}
            </p>
            <p className="mt-2">
              CKD-EPI 2021: <strong>{tfge} mL/min/1,73m²</strong> — {estagioDrc(tfge)}
            </p>
            <p className="mt-2 text-xs">
              DRC exige TFGe &lt;60 confirmada em ≥2 amostras com intervalo ≥3 meses — valor isolado não fecha diagnóstico (KDIGO 2024).
            </p>
          </InfoBanner>
        </>
      )}
    </div>
  );
}
