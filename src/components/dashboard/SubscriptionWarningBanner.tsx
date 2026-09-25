"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubscriptionWarningBanner() {
  const [warning, setWarning] = useState<string | null>(null);
  const [canRenew, setCanRenew] = useState(false);
  const [inFreeTrial, setInFreeTrial] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscription/status");
        const data = await res.json();
        if (res.ok && data.paymentsEnabled && data.showWarning && data.warningMessage) {
          setWarning(data.warningMessage as string);
          setCanRenew(Boolean(data.canRenew));
          setInFreeTrial(Boolean(data.inFreeTrial));
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
      {canRenew ? (
        <Link href="/assinatura" className="ml-2 font-semibold underline underline-offset-2">
          {inFreeTrial ? "Ver plano" : "Renovar"}
        </Link>
      ) : null}
    </div>
  );
}
