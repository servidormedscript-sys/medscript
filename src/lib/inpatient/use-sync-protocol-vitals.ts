"use client";

import { useEffect } from "react";
import { useProtocolInternationBridge } from "@/components/dashboard/protocolos/ProtocolInternationBridge";
import type { ProtocolVitalsPayload } from "@/lib/inpatient/protocol-internation";

function numOrNull(v: number | string | undefined | null): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Sincroniza vitais do protocolo interativo com o fluxo Internar paciente. */
export function useSyncProtocolVitals(input: {
  pas?: number | string | null;
  pad?: number | string | null;
  fc?: number | string | null;
  fr?: number | string | null;
  spo2?: number | string | null;
  temperature?: number | string | null;
  glasgow?: number | string | null;
  weight?: string | null;
}) {
  const { mergeVitals } = useProtocolInternationBridge();

  useEffect(() => {
    const partial: ProtocolVitalsPayload = {
      pas: numOrNull(input.pas),
      pad: numOrNull(input.pad),
      fc: numOrNull(input.fc),
      fr: numOrNull(input.fr),
      spo2: numOrNull(input.spo2),
      temperature: numOrNull(input.temperature),
      glasgow: numOrNull(input.glasgow),
      weight: input.weight?.trim() || undefined,
    };
    const hasAny =
      partial.pas != null ||
      partial.pad != null ||
      partial.fc != null ||
      partial.fr != null ||
      partial.spo2 != null ||
      partial.temperature != null ||
      partial.glasgow != null ||
      partial.weight;
    if (hasAny) mergeVitals(partial);
  }, [
    mergeVitals,
    input.pas,
    input.pad,
    input.fc,
    input.fr,
    input.spo2,
    input.temperature,
    input.glasgow,
    input.weight,
  ]);
}
