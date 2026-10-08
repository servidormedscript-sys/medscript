"use client";

import { useCallback, useEffect, useState } from "react";
import type { SerializedLabCriticalRule } from "@/lib/clinical-rules/lab-critical-rules";
import type { SerializedPrescriptionRule } from "@/lib/clinical-rules/prescription-rules-serialize";
import type { PrescriptionRuleMed } from "@/lib/clinical-rules/prescription-diagnosis";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-2 py-1.5 text-sm text-navy-950 outline-none focus:border-navy-700";

type Tab = "prescricao" | "exames";

export default function ClinicalRulesManager() {
  const [tab, setTab] = useState<Tab>("prescricao");
  const [rules, setRules] = useState<SerializedPrescriptionRule[]>([]);
  const [labRules, setLabRules] = useState<SerializedLabCriticalRule[]>([]);
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);
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
      setLabRules(data.lab_critical_rules ?? []);
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

  function updateRule(id: string, patch: Partial<SerializedPrescriptionRule>) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function updateLabRule(id: string, patch: Partial<SerializedLabCriticalRule>) {
    setLabRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function updateMed(
    ruleId: string,
    medIndex: number,
    patch: Partial<PrescriptionRuleMed>,
  ) {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const meds = [...r.meds];
        meds[medIndex] = { ...meds[medIndex], ...patch };
        return { ...r, meds };
      }),
    );
  }

  function addMed(ruleId: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              meds: [
                ...r.meds,
                {
                  name: "",
                  dose: "",
                  route: "EV",
                  frequency: "",
                  indication: r.label,
                  durationDays: null,
                },
              ],
            }
          : r,
      ),
    );
  }

  function removeMed(ruleId: string, medIndex: number) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, meds: r.meds.filter((_, i) => i !== medIndex) }
          : r,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/organizacao/regras-clinicas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rules,
        lab_critical_rules: labRules,
        rules_version: version,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao salvar." });
      return;
    }
    setRules(data.rules ?? rules);
    setLabRules(data.lab_critical_rules ?? labRules);
    setVersion(data.rules_version ?? version);
    setMessage({ type: "success", text: "Regras clínicas salvas." });
  }

  async function restoreDefaults() {
    if (
      !window.confirm(
        "Restaurar todas as regras (prescrição + exames) para o padrão do MedScript?",
      )
    ) {
      return;
    }
    setSaving(true);
    const res = await fetch("/api/organizacao/regras-clinicas/reset", {
      method: "POST",
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao restaurar." });
      return;
    }
    setRules(data.rules ?? []);
    setLabRules(data.lab_critical_rules ?? []);
    setVersion(data.rules_version ?? "");
    setMessage({ type: "success", text: "Padrões restaurados." });
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
          Regras clínicas versionadas
        </h2>
        <p className="mt-1 text-sm text-navy-800/65">
          PDF 2.5, 2.4 e 5.14 — edite padrões, doses e limiares; marque{" "}
          <strong>Validada</strong> após revisão institucional.
        </p>
        <label className="mt-2 block text-xs text-navy-800/60">
          Versão da tabela
          <input
            className={`${inputClass} mt-1 max-w-xs`}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </label>
      </div>

      <div className="flex gap-1 border-b border-navy-900/8">
        <button
          type="button"
          onClick={() => setTab("prescricao")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "prescricao"
              ? "border-b-2 border-navy-900 text-navy-950"
              : "text-navy-800/50"
          }`}
        >
          Prescrição por diagnóstico ({rules.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("exames")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "exames"
              ? "border-b-2 border-navy-900 text-navy-950"
              : "text-navy-800/50"
          }`}
        >
          Condutas críticas — exames ({labRules.length})
        </button>
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

      {tab === "prescricao" ? (
        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-navy-900/10 bg-white"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                onClick={() =>
                  setExpandedId(expandedId === r.id ? null : r.id)
                }
              >
                <span>
                  <span className="font-medium text-navy-950">{r.label}</span>
                  <span className="ml-2 text-xs text-navy-800/50">{r.id}</span>
                </span>
                <span className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={r.ativo}
                      onChange={(e) =>
                        updateRule(r.id, { ativo: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    Ativa
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={r.validadoInstitucionalmente}
                      onChange={(e) =>
                        updateRule(r.id, {
                          validadoInstitucionalmente: e.target.checked,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    Validada
                  </label>
                </span>
              </button>
              {expandedId === r.id && (
                <div className="space-y-3 border-t border-navy-900/8 px-4 py-3 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-navy-800/70">
                      Rótulo
                      <input
                        className={`${inputClass} mt-1`}
                        value={r.label}
                        onChange={(e) =>
                          updateRule(r.id, { label: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-xs text-navy-800/70">
                      Fonte
                      <input
                        className={`${inputClass} mt-1`}
                        value={r.fonte}
                        onChange={(e) =>
                          updateRule(r.id, { fonte: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-xs text-navy-800/70 sm:col-span-2">
                      Padrão regex (diagnóstico)
                      <input
                        className={`${inputClass} mt-1 font-mono text-xs`}
                        value={r.pattern}
                        onChange={(e) =>
                          updateRule(r.id, { pattern: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-xs text-navy-800/70">
                      Revisado em
                      <input
                        className={`${inputClass} mt-1`}
                        value={r.revisadoEm}
                        onChange={(e) =>
                          updateRule(r.id, { revisadoEm: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-xs text-navy-800/70">
                      Versão da regra
                      <input
                        className={`${inputClass} mt-1`}
                        value={r.versao}
                        onChange={(e) =>
                          updateRule(r.id, { versao: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-900">
                      Medicações sugeridas
                    </p>
                    <ul className="mt-2 space-y-2">
                      {r.meds.map((med, idx) => (
                        <li
                          key={idx}
                          className="grid gap-2 rounded border border-navy-900/8 p-2 sm:grid-cols-6"
                        >
                          <input
                            placeholder="Nome"
                            className={inputClass}
                            value={med.name}
                            onChange={(e) =>
                              updateMed(r.id, idx, { name: e.target.value })
                            }
                          />
                          <input
                            placeholder="Dose"
                            className={inputClass}
                            value={med.dose}
                            onChange={(e) =>
                              updateMed(r.id, idx, { dose: e.target.value })
                            }
                          />
                          <input
                            placeholder="Via"
                            className={inputClass}
                            value={med.route}
                            onChange={(e) =>
                              updateMed(r.id, idx, { route: e.target.value })
                            }
                          />
                          <input
                            placeholder="Frequência"
                            className={inputClass}
                            value={med.frequency}
                            onChange={(e) =>
                              updateMed(r.id, idx, {
                                frequency: e.target.value,
                              })
                            }
                          />
                          <input
                            placeholder="Indicação"
                            className={`${inputClass} sm:col-span-2`}
                            value={med.indication}
                            onChange={(e) =>
                              updateMed(r.id, idx, {
                                indication: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            className="text-xs text-red-700 underline sm:col-span-6"
                            onClick={() => removeMed(r.id, idx)}
                          >
                            Remover linha
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-navy-900 underline"
                      onClick={() => addMed(r.id)}
                    >
                      + Adicionar medicação
                    </button>
                    {r.pediatric && (
                      <p className="mt-2 text-xs text-amber-900">
                        Regra pediátrica: doses por peso vêm do calculador no
                        código quando a lista acima estiver vazia.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {labRules.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-navy-900/10 bg-white"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                onClick={() =>
                  setExpandedLabId(expandedLabId === r.id ? null : r.id)
                }
              >
                <span className="font-medium text-navy-950">{r.title}</span>
                <span className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={r.ativo}
                      onChange={(e) =>
                        updateLabRule(r.id, { ativo: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    Ativa
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={r.validadoInstitucionalmente}
                      onChange={(e) =>
                        updateLabRule(r.id, {
                          validadoInstitucionalmente: e.target.checked,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    Validada
                  </label>
                </span>
              </button>
              {expandedLabId === r.id && (
                <div className="space-y-3 border-t border-navy-900/8 px-4 py-3 text-sm">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs text-navy-800/70">
                      Exame (chave)
                      <input
                        className={`${inputClass} mt-1`}
                        value={r.analyte_key}
                        onChange={(e) =>
                          updateLabRule(r.id, { analyte_key: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-xs text-navy-800/70">
                      Operador
                      <select
                        className={`${inputClass} mt-1`}
                        value={r.op}
                        onChange={(e) =>
                          updateLabRule(r.id, {
                            op: e.target.value as "gte" | "lte",
                          })
                        }
                      >
                        <option value="gte">≥</option>
                        <option value="lte">≤</option>
                      </select>
                    </label>
                    <label className="text-xs text-navy-800/70">
                      Limiar
                      <input
                        type="number"
                        step="any"
                        className={`${inputClass} mt-1`}
                        value={r.threshold}
                        onChange={(e) =>
                          updateLabRule(r.id, {
                            threshold: parseFloat(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="block text-xs text-navy-800/70">
                    Título do card
                    <input
                      className={`${inputClass} mt-1`}
                      value={r.title}
                      onChange={(e) =>
                        updateLabRule(r.id, { title: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-xs text-navy-800/70">
                    Texto da conduta
                    <textarea
                      className={`${inputClass} mt-1 min-h-[4rem]`}
                      value={r.detail}
                      onChange={(e) =>
                        updateLabRule(r.id, { detail: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-xs text-navy-800/70">
                    Fonte
                    <input
                      className={`${inputClass} mt-1`}
                      value={r.fonte}
                      onChange={(e) =>
                        updateLabRule(r.id, { fonte: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-xs text-navy-800/70">
                    Prescrições sugeridas (JSON)
                    <textarea
                      className={`${inputClass} mt-1 min-h-[5rem] font-mono text-xs`}
                      value={JSON.stringify(r.prescriptions ?? [], null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value) as unknown;
                          if (Array.isArray(parsed)) {
                            updateLabRule(r.id, {
                              prescriptions: parsed as SerializedLabCriticalRule["prescriptions"],
                            });
                          }
                        } catch {
                          /* edição em andamento */
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar regras"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={restoreDefaults}
          className="rounded-md border border-navy-900/15 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-60"
        >
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
