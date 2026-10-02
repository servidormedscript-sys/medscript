"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  saveProtocolInternationTransfer,
  type ProtocolInternationTransfer,
} from "@/lib/inpatient/protocol-internation";
import { useProtocolInternationBridge } from "./ProtocolInternationBridge";

type Props = {
  protocolId: string;
  protocolName: string;
  suggestedDiagnosis?: string;
};

export default function ProtocolInternarButton({
  protocolId,
  protocolName,
  suggestedDiagnosis = "",
}: Props) {
  const router = useRouter();
  const bridge = useProtocolInternationBridge();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  function startInternation() {
    const vitalsFromBridge = bridge.vitals
      ? {
          ...bridge.vitals,
          weight: bridge.vitals.weight?.trim() || bridge.weightKg.trim() || undefined,
        }
      : bridge.weightKg.trim()
        ? { weight: bridge.weightKg.trim() }
        : null;

    const payload: Omit<ProtocolInternationTransfer, "createdAt"> = {
      protocolId,
      protocolName,
      suggestedDiagnosis:
        suggestedDiagnosis ||
        `${protocolName} (protocolo clínico)`,
      vitals: vitalsFromBridge,
      freeNote: note.trim(),
      events: bridge.events,
    };
    saveProtocolInternationTransfer(payload);
    setOpen(false);
    router.push("/dashboard/relatorio-pacientes?internar=1");
  }

  return (
    <div className="mt-4 rounded-lg border border-navy-900/10 bg-navy-50/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
      >
        🏥 Internar paciente
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-navy-800/70">
            Nota / condutas já realizadas (opcional)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm"
            placeholder="Ex.: medicações e horários do atendimento no protocolo..."
          />
          <button
            type="button"
            onClick={startInternation}
            className="text-sm font-medium text-navy-900 underline hover:no-underline"
          >
            Abrir cadastro de admissão com estes dados
          </button>
        </div>
      )}
    </div>
  );
}
