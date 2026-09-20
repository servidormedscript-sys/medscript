"use client";

import { useEffect, useState } from "react";

export default function SubscriptionWarningBanner() {
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscription/status");
        const data = await res.json();
        if (res.ok && data.showWarning && data.warningMessage) {
          setWarning(data.warningMessage as string);
        }
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  if (!warning) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">
      <strong className="font-semibold">Aviso do plano:</strong> {warning}
    </div>
  );
}
