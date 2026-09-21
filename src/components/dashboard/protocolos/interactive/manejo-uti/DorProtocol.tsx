"use client";

import { useState } from "react";
import {
  clampEva,
  DEGRAU1,
  DEGRAU2,
  DEGRAU3,
  degrauDor,
  reavaliacaoSugerida,
} from "@/lib/clinical/protocols/interactive/manejo-uti/dor/logic";
import { InfoBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function DorProtocol() {
  const [eva, setEva] = useState("");

  const evaN = clampEva(Number(eva));
  const degrau = degrauDor(evaN);

  return (
    <div className="space-y-4">
      <ProtocolPanel title="EVA / NRS (0–10)">
        <input
          type="number"
          min={0}
          max={10}
          value={eva}
          onChange={(e) => setEva(e.target.value)}
          className="w-full max-w-xs rounded-lg border px-3 py-2 text-lg font-semibold"
        />
        <p className="mt-2 text-sm text-navy-800/70">Valor usado no cálculo: {evaN}</p>
      </ProtocolPanel>

      {degrau === 0 ? (
        <InfoBanner>EVA 0 — sem dor; sem analgesia de rotina necessária.</InfoBanner>
      ) : (
        <InfoBanner>
          Degrau {degrau} — {degrau === 1 ? "leve (1–3)" : degrau === 2 ? "moderada (4–6)" : "intensa (7–10)"}.{" "}
          {reavaliacaoSugerida(degrau)}
        </InfoBanner>
      )}

      {degrau >= 1 && (
        <ProtocolPanel title="Degrau 1 — não opioide (sempre exibido se dor ≥1)">
          <ul className="list-inside list-disc text-sm space-y-1">
            {DEGRAU1.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </ProtocolPanel>
      )}

      {degrau >= 2 && (
        <ProtocolPanel title="Degrau 2 — opioide fraco">
          <ul className="list-inside list-disc text-sm space-y-1">
            {DEGRAU2.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </ProtocolPanel>
      )}

      {degrau >= 3 && (
        <ProtocolPanel title="Degrau 3 — opioide forte">
          <ul className="list-inside list-disc text-sm space-y-1">
            {DEGRAU3.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </ProtocolPanel>
      )}
    </div>
  );
}
