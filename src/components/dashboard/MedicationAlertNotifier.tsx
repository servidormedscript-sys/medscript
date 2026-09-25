"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { patientResumoUrl } from "@/lib/dashboard/medication-alert-url";
import type { DashboardMedicationAlert } from "@/lib/dashboard/overview";
import {
  formatMedicationAlertTime,
  formatMedicationDateTime,
} from "@/lib/dashboard/overview";
import { useClinicRealtime, usePollWhileVisible } from "@/hooks/useClinicRealtime";

const POLL_INTERVAL_MS = 8_000;
const DISMISS_STORAGE_KEY = "medscript.dismissed-medication-alerts";

function readDismissedAlerts() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

function writeDismissedAlerts(ids: Set<string>) {
  sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...ids]));
}

export default function MedicationAlertNotifier() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<DashboardMedicationAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/medication-alerts");
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // Ignora falhas temporárias de rede
    }
  }, []);

  useEffect(() => {
    setDismissedIds(readDismissedAlerts());
  }, []);

  usePollWhileVisible(loadAlerts, POLL_INTERVAL_MS);
  useClinicRealtime(loadAlerts);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedIds.has(alert.alert_id)),
    [alerts, dismissedIds]
  );

  function dismissAlert(alertId: string) {
    setDismissedIds((current) => {
      const next = new Set(current);
      next.add(alertId);
      writeDismissedAlerts(next);
      return next;
    });
  }

  function openAlert(alert: DashboardMedicationAlert) {
    router.push(patientResumoUrl(alert.episode_id));
  }

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <aside
      className="pointer-events-none fixed right-3 top-[max(5.5rem,env(safe-area-inset-top))] z-50 flex w-[min(100%-1.5rem,24rem)] flex-col gap-3 sm:right-4"
      aria-live="polite"
      aria-label="Alertas de medicamentos"
    >
      {visibleAlerts.map((alert) => (
        <div
          key={alert.alert_id}
          className={`pointer-events-auto overflow-hidden rounded-lg border shadow-lg ${
            alert.is_overdue
              ? "border-red-300 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-2 p-3">
            <button
              type="button"
              onClick={() => openAlert(alert)}
              className="min-w-0 flex-1 text-left"
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  alert.is_overdue ? "text-red-800" : "text-amber-900"
                }`}
              >
                {alert.is_overdue ? "Medicamento em atraso" : "Medicamento em breve"}
              </p>
              <p className="mt-1 text-sm font-medium text-navy-950">
                {alert.patient_name}
              </p>
              <p className="mt-0.5 text-xs text-navy-800/70">
                {alert.medication}
                {alert.bed ? ` · Leito ${alert.bed}` : ""}
              </p>
              <p className="mt-1 text-xs text-navy-800/60">
                {formatMedicationDateTime(new Date(alert.due_at))} ·{" "}
                {formatMedicationAlertTime(alert)}
              </p>
              <p className="mt-2 text-[11px] font-medium text-navy-800/75">
                Clique para abrir o resumo do paciente
              </p>
            </button>
            <button
              type="button"
              onClick={() => dismissAlert(alert.alert_id)}
              className="shrink-0 rounded-md p-1 text-navy-800/45 transition-colors hover:bg-black/5 hover:text-navy-900"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
