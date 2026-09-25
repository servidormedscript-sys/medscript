"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { classificarQtc, qtcBazett, qtcFridericia, type SexoEcg } from "@/lib/clinical/tools/ecg/logic";
import { DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function EcgTool() {
  const [ritmo, setRitmo] = useState("sinusal");
  const [fc, setFc] = useState("");
  const [qt, setQt] = useState("");
  const [sexo, setSexo] = useState<SexoEcg>(null);
  const [supra, setSupra] = useState(false);
  const [infra, setInfra] = useState(false);
  const [parede, setParede] = useState("");
  const [outros, setOutros] = useState("");
  const [contexto, setContexto] = useState("");

  const fcN = Number(fc) || 0;
  const qtN = Number(qt) || 0;
  const qtcB = useMemo(() => (fcN && qtN ? qtcBazett(qtN, fcN) : null), [qtN, fcN]);
  const qtcF = useMemo(() => (fcN && qtN ? qtcFridericia(qtN, fcN) : null), [qtN, fcN]);
  const qtcClass = qtcB != null ? classificarQtc(qtcB, sexo) : null;

  const showParede = supra || infra;

  const laudo = [
    "Rascunho — revisar antes de assinar",
    `Ritmo: ${ritmo}`,
    fcN ? `FC: ${fcN} bpm` : null,
    qtN ? `QT: ${qtN} ms` : null,
    qtcB != null ? `QTc Bazett: ${qtcB.toFixed(0)} ms (${qtcClass})` : null,
    qtcF != null ? `QTc Fridericia: ${qtcF.toFixed(0)} ms` : null,
    supra ? `Supra de ST${parede ? ` — ${parede}` : ""}` : null,
    infra && !supra ? `Infra de ST${parede ? ` — ${parede}` : ""}` : null,
    outros ? `Outros: ${outros}` : null,
    contexto ? `Contexto: ${contexto}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-4">
      <InfoBanner>Não lê traçado automaticamente — registre achados observados; o app organiza o laudo e calcula QTc.</InfoBanner>
      <ProtocolPanel title="Laudo assistido">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Ritmo
            <select value={ritmo} onChange={(e) => setRitmo(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              {["sinusal", "FA", "flutter", "TSV", "TV", "bradicardia sinusal", "BAV 1", "Mobitz I", "Mobitz II", "BAVT", "juncional", "marcapasso", "outro"].map(
                (r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="text-sm">
            Sexo (QTc)
            <select value={sexo ?? ""} onChange={(e) => setSexo((e.target.value || null) as SexoEcg)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">Não informado</option>
              <option value="H">Homem</option>
              <option value="M">Mulher</option>
            </select>
          </label>
          <label className="text-sm">
            FC
            <input type="number" value={fc} onChange={(e) => setFc(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            QT (ms)
            <input type="number" value={qt} onChange={(e) => setQt(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={supra} onChange={(e) => setSupra(e.target.checked)} />
          Supra de ST
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={infra} onChange={(e) => setInfra(e.target.checked)} />
          Infra de ST
        </label>
        {showParede && (
          <label className="mt-2 text-sm">
            Parede
            <select value={parede} onChange={(e) => setParede(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="">—</option>
              {["anterior", "inferior", "lateral", "septal", "posterior", "alta lateral", "extensa"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea value={outros} onChange={(e) => setOutros(e.target.value)} placeholder="Outros achados" className="mt-3 w-full rounded-lg border p-3 text-sm" rows={2} />
        <textarea value={contexto} onChange={(e) => setContexto(e.target.value)} placeholder="Contexto clínico" className="mt-2 w-full rounded-lg border p-3 text-sm" rows={2} />
      </ProtocolPanel>

      {supra && (
        <DangerBanner title="Supra de ST">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=iam-supra-st" className="text-red-800 underline">
            IAM com supra
          </Link>
        </DangerBanner>
      )}
      {infra && !supra && (
        <DangerBanner title="Infra de ST">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=sca-sem-supra-st" className="text-red-800 underline">
            SCA sem supra
          </Link>
        </DangerBanner>
      )}
      {qtcClass && (qtcClass.includes("Prolongado") || qtcClass.includes("Muito")) && (
        <DangerBanner title={`QTc ${qtcClass} — revisar fármacos e K/Mg/Ca`}>
          <Link href="/dashboard/protocolos-clinicos?category=clinica-aguda&protocol=disturbios-eletroliticos" className="text-red-800 underline">
            Distúrbios eletrolíticos
          </Link>
        </DangerBanner>
      )}
      {(ritmo === "BAVT" || (fcN > 0 && fcN < 40)) && (
        <DangerBanner title="Bradicardia / BAVT">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=bradiarritmias" className="text-red-800 underline">
            Bradiarritmias
          </Link>
        </DangerBanner>
      )}
      {ritmo === "TV" && (
        <DangerBanner title="TV — emergência se instável">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=taquiarritmias" className="text-red-800 underline">
            Taquiarritmias
          </Link>
        </DangerBanner>
      )}

      <ProtocolPanel title="Texto copiável">
        <pre className="whitespace-pre-wrap rounded-lg bg-navy-50 p-4 text-xs">{laudo}</pre>
      </ProtocolPanel>
    </div>
  );
}
