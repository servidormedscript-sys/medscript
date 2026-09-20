"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImpersonationBannerProps = {
  adminLabel: string;
};

export default function ImpersonationBanner({ adminLabel }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exitView() {
    setLoading(true);
    await fetch("/api/platform/impersonate", { method: "DELETE" });
    router.push("/dashboard/admin-plataforma");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-200 bg-violet-50 px-6 py-3 text-sm text-violet-950">
      <p>
        Visualizando o painel da clínica: <strong>{adminLabel}</strong>
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={exitView}
        className="rounded-full border border-violet-300 bg-white px-4 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-60"
      >
        {loading ? "Saindo..." : "Voltar ao admin do site"}
      </button>
    </div>
  );
}
