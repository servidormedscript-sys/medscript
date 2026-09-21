"use client";

import Link from "next/link";
import { useState } from "react";
import {
  alertaArritmia,
  calcDeficitAguaMl,
  calcNaCl3Hiponatremia,
  gravidade,
  type DisturbioId,
} from "@/lib/clinical/protocols/interactive/metabolico/eletrolitos/logic";
import { DangerBanner, InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

const TABS: { id: DisturbioId; label: string; unit: string }[] = [
  { id: "hiperk", label: "Hipercalemia", unit: "mEq/L" },
  { id: "hipok", label: "Hipocalemia", unit: "mEq/L" },
  { id: "hiponat", label: "Hiponatremia", unit: "mEq/L" },
  { id: "hipernat", label: "Hipernatremia", unit: "mEq/L" },
  { id: "hipocal", label: "Hipocalcemia", unit: "mg/dL (Ca total)" },
  { id: "hipercal", label: "Hipercalcemia", unit: "mg/dL" },
  { id: "hipomg", label: "Hipomagnesemia", unit: "mg/dL" },
];

export default function EletrolitosProtocol() {
  const [tab, setTab] = useState<DisturbioId>("hiperk");
  const [valor, setValor] = useState("");
  const [peso, setPeso] = useState("");
  const [sexo, setSexo] = useState<"H" | "M">("H");
  const [ir, setIr] = useState(false);

  const v = Number(valor) || 0;
  const pesoN = Number(peso) || 70;
  const g = gravidade(tab, v);
  const arritmia = alertaArritmia(g, tab);

  const volHiponat = tab === "hiponat" && g === "grave" ? calcNaCl3Hiponatremia(pesoN, sexo, v) : null;
  const deficit = tab === "hipernat" ? calcDeficitAguaMl(pesoN, sexo, v) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t.id ? "bg-ocean-700 text-white" : "bg-navy-50 text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ProtocolPanel title="Dados">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm sm:col-span-2">
            Valor sérico ({TABS.find((x) => x.id === tab)?.unit})
            <input type="number" step="0.1" value={valor} onChange={(e) => setValor(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Peso (kg)
            <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            Sexo (ACT)
            <select value={sexo} onChange={(e) => setSexo(e.target.value as "H" | "M")} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="H">Homem</option>
              <option value="M">Mulher</option>
            </select>
          </label>
        </div>
        {tab === "hipomg" && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ir} onChange={(e) => setIr(e.target.checked)} />
            Insuficiência renal (reduzir Mg 50–75%)
          </label>
        )}
      </ProtocolPanel>

      <InfoBanner>
        Gravidade: <strong>{g.toUpperCase()}</strong>
        {tab === "hiponat" && v > 0 ? (
          <span className="mt-1 block text-xs">Limite correção: ~8–10 mEq/L/24 h (alto risco: mais conservador).</span>
        ) : null}
        {tab === "hipernat" && v > 0 ? (
          <span className="mt-1 block text-xs">Limite redução: (Na−12) a (Na−10) mEq/L/24 h.</span>
        ) : null}
      </InfoBanner>

      {arritmia ? (
        <DangerBanner title="Risco de arritmia — monitorização contínua">
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=taquiarritmias" className="text-red-800 underline">
            Taquiarritmias
          </Link>
          {" · "}
          <Link href="/dashboard/protocolos-clinicos?category=cardiologia&protocol=bradiarritmias" className="text-red-800 underline">
            Bradiarritmias
          </Link>
          {" · "}
          <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=pcr-adulto" className="text-red-800 underline">
            PCR
          </Link>
        </DangerBanner>
      ) : null}

      <ProtocolPanel title="Conduta resumida">
        {tab === "hiperk" && (g === "critico" || g === "grave") && (
          <ul className="list-inside list-disc text-sm space-y-1">
            <li>Gluconato Ca 10% 30 mL/10 min (máx. 3 doses se ECG alterado)</li>
            <li>Insulina 10 UI + Glicose 50% 50 mL</li>
            <li>Salbutamol nebulizado 10–20 mg; Furosemida 40–80 mg; resina 15–30 g 6/6h</li>
          </ul>
        )}
        {tab === "hipok" && g === "critico" && <p className="text-sm">KCl 10–20 mEq/100 mL SF/1 h (máx. periférico 10 mEq/h).</p>}
        {tab === "hiponat" && g === "critico" && <p className="text-sm">NaCl 3% 100 mL/10–15 min (máx. 3 doses); alvo +4–6 mEq/L/6 h.</p>}
        {volHiponat != null && volHiponat > 0 && (
          <p className="mt-2 text-sm">Hiponatremia grave — volume NaCl 3% estimado: ~{volHiponat} mL em 24 h (Adrogué-Madias).</p>
        )}
        {deficit && v > 140 && (
          <p className="text-sm">
            Déficit água livre ~{deficit.volumeMl} mL; duração sugerida ≥{deficit.duracaoHoras} h.
          </p>
        )}
        {tab === "hipocal" && g === "grave" && <p className="text-sm">Gluconato Ca 10% 10–20 mL/10 min + 50–100 mL/h.</p>}
        {tab === "hipercal" && (g === "grave" || g === "critico") && (
          <p className="text-sm">SF 200–300 mL/h; calcitonina 4 UI/kg 12/12h; zoledrônico 4 mg/15 min ou denosumabe 120 mg SC.</p>
        )}
        {tab === "hipomg" && g === "critico" && (
          <p className="text-sm">Sulfato Mg 2 g/15 min + 4–6 g/24 h{ir ? " (IR: reduzir 50–75%)" : ""}.</p>
        )}
        {g === "leve" || g === "moderado" ? (
          <p className="mt-2 text-xs text-navy-800/60">Reavaliar em 2–12 h conforme distúrbio e gravidade.</p>
        ) : null}
      </ProtocolPanel>
    </div>
  );
}
