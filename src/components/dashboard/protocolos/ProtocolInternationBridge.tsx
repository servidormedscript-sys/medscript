"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ProtocolInternationEvent,
  ProtocolVitalsPayload,
} from "@/lib/inpatient/protocol-internation";

type BridgeValue = {
  weightKg: string;
  vitals: ProtocolVitalsPayload | null;
  events: ProtocolInternationEvent[];
  setVitals: (v: ProtocolVitalsPayload | null) => void;
  mergeVitals: (partial: ProtocolVitalsPayload) => void;
  logEvent: (text: string) => void;
};

const Ctx = createContext<BridgeValue | null>(null);

export function ProtocolInternationProvider({
  weightKg,
  children,
}: {
  weightKg: string;
  children: ReactNode;
}) {
  const [vitals, setVitals] = useState<ProtocolVitalsPayload | null>(null);
  const [events, setEvents] = useState<ProtocolInternationEvent[]>([]);

  const mergeVitals = useCallback((partial: ProtocolVitalsPayload) => {
    setVitals((prev) => ({ ...prev, ...partial }));
  }, []);

  const logEvent = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setEvents((prev) => [
      ...prev,
      {
        at: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: trimmed,
      },
    ]);
  }, []);

  const value = useMemo(
    () => ({
      weightKg,
      vitals,
      events,
      setVitals,
      mergeVitals,
      logEvent,
    }),
    [weightKg, vitals, events, mergeVitals, logEvent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProtocolInternationBridge(): BridgeValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      weightKg: "",
      vitals: null,
      events: [],
      setVitals: () => {},
      mergeVitals: () => {},
      logEvent: () => {},
    };
  }
  return ctx;
}
