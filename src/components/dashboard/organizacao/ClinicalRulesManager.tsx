"use client";

import { useCallback, useEffect, useState } from "react";
import type { SerializedPrescriptionRule } from "@/lib/clinical-rules/prescription-rules-serialize";

export default function ClinicalRulesManager() {
  const [rules, setRules] = useState<SerializedPrescriptionRule[]>([]);
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizacao/regras-clinicas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar.");
      setRules(data.rules ?? []);
      setVersion(data.rules_version ?? "");
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Erro ao carregar regras.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleField(
    id: string,
    field: "ativo" | "validadoInstitucionalmente",
  ) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: !r[field] } : r,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/organizacao/regras-clinicas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules, rules_version: version }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao salvar." });
      return;
    }
    setRules(data.rules ?? rules);
    setVersion(data.rules_version ?? version);
    setMessage({
      type: "success",
      text: "Regras clínicas salvas (PDF 5.14). Sugestões na prescrição usam esta tabela.",
    });
  }

  if (loading) {
    return (
      <p className="text-sm text-navy-800/60">Carregando regras clínicas…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-navy-950">
          Regras de prescrição por diagnóstico
        </h2>
        <p className="mt-1 text-sm text-navy-800/65">
          Tabelas versionadas (2.5 / 5.14). Marque{" "}
          <strong>Validada</strong> após revisão institucional; só regras
          validadas e ativas entram nas sugestões.
        </p>
        <p className="mt-1 text-xs text-navy-800/50">
          Versão: {version || "—"} · {rules.length} regra(s)
        </p>
      </div>

      {message && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-navy-900/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-navy-50/80 text-xs uppercase text-navy-800/60">
            <tr>
              <th className="px-3 py-2">Regra</th>
              <th className="px-3 py-2">Fonte</th>
              <th className="px-3 py-2">Revisão</th>
              <th className="px-3 py-2">Ativa</th>
              <th className="px-3 py-2">Validada</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-navy-900/8">
                <td className="px-3 py-2">
                  <p className="font-medium text-navy-950">{r.label}</p>
                  <p className="text-xs text-navy-800/50">{r.id}</p>
                </td>
                <td className="max-w-[12rem] px-3 py-2 text-xs text-navy-800/70">
                  {r.fonte}
                </td>
                <td className="px-3 py-2 text-xs">{r.revisadoEm}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.ativo}
                    onChange={() => toggleField(r.id, "ativo")}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.validadoInstitucionalmente}
                    onChange={() =>
                      toggleField(r.id, "validadoInstitucionalmente")
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar regras"}
      </button>
    </div>
  );
}
