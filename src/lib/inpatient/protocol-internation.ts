export const PROTOCOL_INTERNATION_STORAGE_KEY = "medscript_protocol_internation_v1";

export type ProtocolVitalsPayload = {
  pas?: number | null;
  pad?: number | null;
  fc?: number | null;
  fr?: number | null;
  spo2?: number | null;
  temperature?: number | null;
  glasgow?: number | null;
  weight?: string;
};

export type ProtocolInternationEvent = {
  at: string;
  text: string;
};

export type ProtocolInternationTransfer = {
  protocolId: string;
  protocolName: string;
  suggestedDiagnosis: string;
  vitals: ProtocolVitalsPayload | null;
  freeNote: string;
  events: ProtocolInternationEvent[];
  createdAt: string;
};

export function saveProtocolInternationTransfer(
  payload: Omit<ProtocolInternationTransfer, "createdAt">,
): void {
  if (typeof window === "undefined") return;
  const full: ProtocolInternationTransfer = {
    ...payload,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(
    PROTOCOL_INTERNATION_STORAGE_KEY,
    JSON.stringify(full),
  );
}

export function readProtocolInternationTransfer(): ProtocolInternationTransfer | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PROTOCOL_INTERNATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProtocolInternationTransfer;
  } catch {
    return null;
  }
}

export function clearProtocolInternationTransfer(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROTOCOL_INTERNATION_STORAGE_KEY);
}

export function protocolTransferToAdmissionForm(
  t: ProtocolInternationTransfer,
): {
  diagnosis: string;
  initial_assessment: string;
  weight: string;
  initial_status: "internado";
} {
  const vitalsBits: string[] = [];
  const v = t.vitals;
  if (v?.glasgow) vitalsBits.push(`Glasgow ${v.glasgow}`);
  if (v?.spo2) vitalsBits.push(`SatO₂ ${v.spo2}%`);
  if (v?.pas) vitalsBits.push(`PAS ${v.pas}`);
  if (v?.fc) vitalsBits.push(`FC ${v.fc}`);
  if (v?.fr) vitalsBits.push(`FR ${v.fr}`);
  if (v?.temperature) vitalsBits.push(`Tax ${v.temperature}°C`);

  const parts = [
    `Origem: protocolo ${t.protocolName}.`,
    vitalsBits.length ? `Vitais no protocolo: ${vitalsBits.join(", ")}.` : null,
    t.freeNote.trim() ? t.freeNote.trim() : null,
  ].filter(Boolean);

  return {
    diagnosis: t.suggestedDiagnosis,
    initial_assessment: parts.join("\n"),
    weight: t.vitals?.weight?.trim() ?? "",
    initial_status: "internado",
  };
}
