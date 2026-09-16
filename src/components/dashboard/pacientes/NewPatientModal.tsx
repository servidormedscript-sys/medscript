"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { PatientSex, PatientStatus, RiskLevel } from "@/lib/types/patient";
import {
  INITIAL_KANBAN_OPTIONS,
  RISK_LABELS,
  STATUS_LABELS,
} from "@/lib/types/patient";
import { meuPacienteGraveT0Url } from "@/lib/dashboard/meu-paciente-grave-url";
import { formatAge } from "@/lib/utils/age";

type NewPatientModalProps = {
  onClose: () => void;
  onCreated: () => void;
  onError: (text: string) => void;
  lockInitialStatus?: PatientStatus;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

const defaultForm = {
  full_name: "",
  cpf: "",
  birth_date: "",
  sex: "masculino" as PatientSex,
  weight: "",
  bed: "",
  diagnosis: "",
  allergies: "",
  medications: "",
  initial_status: "triagem" as PatientStatus,
  risk_level: "medio" as RiskLevel,
  alta_days: 7,
};

export default function NewPatientModal({
  onClose,
  onCreated,
  onError,
  lockInitialStatus,
}: NewPatientModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [goingToT0, setGoingToT0] = useState(false);
  const [form, setForm] = useState({
    ...defaultForm,
    initial_status: lockInitialStatus ?? defaultForm.initial_status,
  });

  const ageLabel = form.birth_date ? formatAge(form.birth_date) : null;

  async function createPatient(redirectToT0: boolean) {
    if (redirectToT0) {
      setGoingToT0(true);
    } else {
      setLoading(true);
    }

    const res = await fetch("/api/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);
    setGoingToT0(false);

    if (!res.ok) {
      onError(data.error ?? "Erro ao cadastrar paciente.");
      if (res.status === 409) onClose();
      return;
    }

    if (redirectToT0 && data.episode?.id) {
      onClose();
      router.push(meuPacienteGraveT0Url(data.episode.id));
      return;
    }

    onCreated();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPatient(false);
  }

  async function handleGoToT0() {
    if (!formRef.current?.reportValidity()) return;
    await createPatient(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-navy-900/10 bg-white shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-navy-950">Cadastro de paciente</h2>
            <p className="text-sm text-navy-800/60">
              {lockInitialStatus
                ? "O paciente será cadastrado diretamente na triagem."
                : "Preencha os dados e selecione a situação inicial no Kanban."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-navy-800/50 hover:text-navy-800"
          >
            ✕
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-navy-950">Identificação</h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Nome completo *
              </label>
              <input
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  CPF *
                </label>
                <input
                  required
                  placeholder="00000000000"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Data de nascimento *
                </label>
                <input
                  required
                  type="date"
                  value={form.birth_date}
                  onChange={(e) =>
                    setForm({ ...form, birth_date: e.target.value })
                  }
                  className={inputClass}
                />
                {ageLabel && (
                  <p className="mt-1 text-xs text-navy-700">
                    Idade: <strong>{ageLabel}</strong>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Sexo *
              </label>
              <select
                required
                value={form.sex}
                onChange={(e) =>
                  setForm({ ...form, sex: e.target.value as PatientSex })
                }
                className={inputClass}
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </section>

          <section className="space-y-4 border-t border-navy-900/8 pt-5">
            <h3 className="text-sm font-medium text-navy-950">Dados clínicos</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Peso
                </label>
                <input
                  placeholder="Ex: 72 kg"
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Leito
                </label>
                <input
                  placeholder="Ex: 12A"
                  value={form.bed}
                  onChange={(e) => setForm({ ...form, bed: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Diagnóstico / motivo de internação
              </label>
              <textarea
                rows={2}
                value={form.diagnosis}
                onChange={(e) =>
                  setForm({ ...form, diagnosis: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Alergias
              </label>
              <textarea
                rows={2}
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Medicações de uso domiciliar
              </label>
              <textarea
                rows={2}
                value={form.medications}
                onChange={(e) =>
                  setForm({ ...form, medications: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-navy-900/8 pt-5">
            <h3 className="text-sm font-medium text-navy-950">
              Situação no Kanban
            </h3>

            {!lockInitialStatus && (
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Situação inicial *
                </label>
                <select
                  value={form.initial_status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initial_status: e.target.value as PatientStatus,
                    })
                  }
                  className={inputClass}
                >
                  {INITIAL_KANBAN_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {lockInitialStatus && (
              <p className="rounded-md border border-navy-900/8 bg-navy-50/50 px-3 py-2 text-sm text-navy-800/70">
                Situação inicial: <strong>{STATUS_LABELS[lockInitialStatus]}</strong>
              </p>
            )}

            {form.initial_status === "internado" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Classificação de risco *
                </label>
                <select
                  value={form.risk_level}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      risk_level: e.target.value as RiskLevel,
                    })
                  }
                  className={inputClass}
                >
                  {(Object.keys(RISK_LABELS) as RiskLevel[]).map((risk) => (
                    <option key={risk} value={risk}>
                      {RISK_LABELS[risk]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rounded-md border border-navy-900/8 bg-navy-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy-950">
                    Avaliação T0
                  </p>
                  <p className="text-xs text-navy-800/60">
                    Cadastre o paciente e preencha a ficha em Meu Paciente Grave.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoToT0}
                  disabled={loading || goingToT0}
                  className="rounded-md border border-navy-900/12 bg-white px-4 py-2 text-xs font-medium text-navy-800 transition-colors hover:bg-navy-50 disabled:opacity-60"
                >
                  {goingToT0 ? "Cadastrando..." : "Avaliação T0"}
                </button>
              </div>
            </div>
          </section>

          <div className="flex gap-3 border-t border-navy-900/8 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-navy-900/12 py-2.5 text-sm font-medium text-navy-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || goingToT0}
              className="flex-1 rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Cadastrar paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
