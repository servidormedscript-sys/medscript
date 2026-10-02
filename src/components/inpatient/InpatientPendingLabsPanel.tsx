"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { inpatientChartUrl } from "@/lib/dashboard/inpatient-chart-url";

type PendingItem = {
  episode_id: string;
  patient_name: string;
  bed: string | null;
  label: string;
  urgent: boolean;
  requested_at: string;
  hours_pending: number;
};

export default function InpatientPendingLabsPanel() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pacientes/internados/exames-pendentes");
    const data = await res.json();
    setLoading(false);
    if (res.ok) setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-navy-800/50">Carregando exames pendentes...</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-navy-800/55">
        Nenhum exame laboratorial pendente entre internados.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.slice(0, 8).map((item) => (
        <li
          key={`${item.episode_id}-${item.label}-${item.requested_at}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded border border-navy-900/8 bg-navy-50/40 px-3 py-2"
        >
          <span>
            {item.urgent ? "🔴 " : ""}
            <strong>{item.patient_name}</strong>
            {item.bed ? ` (${item.bed})` : ""} — {item.label} (
            {Math.floor(item.hours_pending)}h)
          </span>
          <Link
            href={inpatientChartUrl(item.episode_id, "exames")}
            className="text-xs font-medium text-navy-800 underline hover:no-underline"
          >
            Exames
          </Link>
        </li>
      ))}
    </ul>
  );
}
