"use client";

import { useCallback, useEffect, useState } from "react";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import {
  BED_STATUS_LABELS,
  type OrganizationBed,
  type OrganizationBedStatus,
} from "@/lib/types/organization-bed";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

type Props = {
  isAdmin: boolean;
};

export default function BedsManager({ isAdmin }: Props) {
  const [beds, setBeds] = useState<OrganizationBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState({ code: "", unit: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizacao/leitos");
      const data = await res.json();
      if (res.ok) setBeds(data.beds ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useClinicRealtime(load);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/organizacao/leitos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao criar leito." });
      return;
    }
    setMessage({ type: "success", text: "Leito cadastrado." });
    setForm({ code: "", unit: "" });
    load();
  }

  async function removeBed(id: string) {
    setMessage(null);
    const res = await fetch(`/api/organizacao/leitos/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao excluir." });
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "error"
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message.text}
        </p>
      )}

      {isAdmin && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-navy-900/8 bg-white p-4"
        >
          <h3 className="text-sm font-medium text-navy-950">Novo leito</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-navy-800/60">Código *</label>
              <input
                required
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ex: 12A"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-navy-800/60">Unidade / setor</label>
              <input
                className={inputClass}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Ex: Enfermaria 2º andar"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            Adicionar leito
          </button>
        </form>
      )}

      <div className="rounded-lg border border-navy-900/8 bg-white">
        <div className="border-b border-navy-900/8 px-4 py-3">
          <h3 className="text-sm font-medium text-navy-950">Leitos cadastrados</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-navy-800/60">Carregando...</p>
        ) : beds.length === 0 ? (
          <p className="p-4 text-sm text-navy-800/60">Nenhum leito cadastrado.</p>
        ) : (
          <ul className="divide-y divide-navy-900/6">
            {beds.map((bed) => (
              <li
                key={bed.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-navy-950">
                    {bed.code}
                    {bed.unit ? ` · ${bed.unit}` : ""}
                  </p>
                  <p className="text-xs text-navy-800/55">
                    {BED_STATUS_LABELS[bed.status as OrganizationBedStatus]}
                  </p>
                </div>
                {isAdmin && bed.status !== "ocupado" && (
                  <button
                    type="button"
                    onClick={() => removeBed(bed.id)}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Excluir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
