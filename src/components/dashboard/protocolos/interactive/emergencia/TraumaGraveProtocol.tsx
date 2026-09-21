"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckboxField, DangerBanner, ProtocolPanel } from "@/components/dashboard/protocolos/interactive/shared/ProtocolUi";

export default function TraumaGraveProtocol() {
  const [abcde, setAbcde] = useState({
    via: false,
    resp: false,
    circ: false,
    neuro: false,
    exp: false,
  });
  const [hemorragia, setHemorragia] = useState(false);

  const done = Object.values(abcde).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <ProtocolPanel title="ABCDE (checklist)">
        {(
          [
            ["A — Via aérea + colar cervical se indicado", "via"],
            ["B — Ventilação / SpO₂ / tórax", "resp"],
            ["C — Circulação / choque / acesso", "circ"],
            ["D — Disability (GCS, pupilas)", "neuro"],
            ["E — Exposição / controle térmico", "exp"],
          ] as const
        ).map(([label, key]) => (
          <CheckboxField
            key={key}
            label={label}
            checked={abcde[key]}
            onChange={(v) => setAbcde((p) => ({ ...p, [key]: v }))}
          />
        ))}
        <p className="text-xs text-navy-800/60">{done}/5 blocos revisados</p>
      </ProtocolPanel>

      <CheckboxField label="Hemorragia externa não controlada" checked={hemorragia} onChange={setHemorragia} />

      {(hemorragia || abcde.circ) && (
        <DangerBanner
          title="Choque hemorrágico — ressuscitação imediata"
          href="/dashboard/protocolos-clinicos?category=emergencia&protocol=choque-hemorragico"
          linkLabel="Abrir choque hemorrágico"
        />
      )}

      <ProtocolPanel title="ISR / via aérea difícil">
        <Link href="/dashboard/protocolos-clinicos?category=emergencia&protocol=isr" className="text-sm font-semibold text-ocean-800 underline">
          Intubação em sequência rápida
        </Link>
      </ProtocolPanel>
    </div>
  );
}
