"use client";

import { useState } from "react";
import {
  HEMO_TAB_CONTENT,
  HEMO_TABS,
  TRANSFUSION_REACTIONS,
  type HemoTab,
  type TransfusionReactionId,
} from "@/lib/clinical/protocols/interactive/emergencia/hemotransfusao/logic";
import { ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

function tabButtonClass(active: boolean) {
  return active
    ? "bg-navy-900 text-white"
    : "bg-white text-navy-900 hover:bg-navy-50";
}

export default function HemotransfusaoProtocol() {
  const [tab, setTab] = useState<HemoTab>("indicacoes");
  const [reactionId, setReactionId] = useState<TransfusionReactionId>("anafilatica");

  const reaction = TRANSFUSION_REACTIONS.find((r) => r.id === reactionId)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {HEMO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold transition-colors ${tabButtonClass(tab === t.id)}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "reacoes" && (
        <ProtocolPanel title={HEMO_TAB_CONTENT[tab].title}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-navy-900/85">
            {HEMO_TAB_CONTENT[tab].items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProtocolPanel>
      )}

      {tab === "reacoes" && (
        <>
          <ProtocolPanel title="Tipo de reação">
            <select
              value={reactionId}
              onChange={(e) => setReactionId(e.target.value as TransfusionReactionId)}
              className="w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm"
            >
              {TRANSFUSION_REACTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.grave ? " — grave" : ""}
                </option>
              ))}
            </select>
          </ProtocolPanel>

          <section
            className={`rounded-xl border p-5 ${
              reaction.grave
                ? "border-red-300 bg-red-50"
                : "border-navy-900/10 bg-white"
            }`}
          >
            <h4
              className={`text-sm font-semibold ${
                reaction.grave ? "text-red-950" : "text-navy-950"
              }`}
            >
              {reaction.name}
              {reaction.grave ? " — reação grave" : ""}
            </h4>
            <p
              className={`mt-2 text-sm ${
                reaction.grave ? "text-red-900/90" : "text-navy-800/85"
              }`}
            >
              {reaction.presentation}
            </p>
            {reaction.differentiate && (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  reaction.grave
                    ? "border-red-200 bg-red-100/80 text-red-950"
                    : "border-ocean-200 bg-ocean-50 text-ocean-950"
                }`}
              >
                {reaction.differentiate}
              </p>
            )}
            <ul
              className={`mt-4 list-disc space-y-2 pl-5 text-sm ${
                reaction.grave ? "text-red-900/90" : "text-navy-900/85"
              }`}
            >
              {reaction.conduct.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
