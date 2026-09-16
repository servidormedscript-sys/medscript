"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KanbanEpisode, Patient, PatientEpisode, PatientSex } from "@/lib/types/patient";
import { meuPacienteGraveT0Url } from "@/lib/dashboard/meu-paciente-grave-url";
import { formatAge } from "@/lib/utils/age";
import { formatCpf } from "@/lib/utils/cpf";

type FichaData = (KanbanEpisode | (PatientEpisode & { patient: Patient })) & {
  patient: Patient;
};

type EditPatientFichaModalProps = {
  episode: FichaData;
  onClose: () => void;
  onSaved: () => void;
  onError: (text: string) => void;
};

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

export default function EditPatientFichaModal({
  episode,
  onClose,
  onSaved,
  onError,
}: EditPatientFichaModalProps) {
  const patient = episode.patient;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: patient.full_name,
    birth_date: patient.birth_date ?? "",
    sex: (patient.sex ?? "masculino") as PatientSex,
    weight: episode.weight ?? "",
    bed: episode.bed ?? "",
    diagnosis: episode.diagnosis ?? "",
    allergies: episode.allergies ?? "",
    medications: episode.medications ?? "",
  });

  const ageLabel = form.birth_date ? formatAge(form.birth_date) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const patientRes = await fetch(`/api/pacientes/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.full_name,
        birth_date: form.birth_date,
        sex: form.sex,
      }),
    });

    if (!patientRes.ok) {
      const data = await patientRes.json();
      setLoading(false);
      onError(data.error ?? "Erro ao atualizar dados do paciente.");
      return;
    }

    const episodeRes = await fetch(`/api/pacientes/episodios/${episode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weight: form.weight,
        bed: form.bed,
        diagnosis: form.diagnosis,
        allergies: form.allergies,
        medications: form.medications,
      }),
    });

    setLoading(false);

    if (!episodeRes.ok) {
      const data = await episodeRes.json();
      onError(data.error ?? "Erro ao atualizar ficha.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-navy-900/10 bg-white shadow-lg">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4">
            <div>
              <h2 className="text-lg font-medium text-navy-950">
                Editar ficha cadastral
              </h2>
              <p className="text-sm text-navy-800/60">
                Ficha #{episode.episode_number} · CPF {formatCpf(patient.cpf)}
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

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
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
                    CPF
                  </label>
                  <input
                    disabled
                    value={formatCpf(patient.cpf)}
                    className={`${inputClass} bg-navy-50 text-navy-800/60`}
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

              <div className="rounded-md border border-navy-900/8 bg-navy-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-navy-950">
                      Avaliação T0
                    </p>
                    <p className="text-xs text-navy-800/60">
                      {episode.initial_assessment
                        ? "Laudo T0 registrado na ficha"
                        : "Preencha a avaliação clínica em Meu Paciente Grave"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(meuPacienteGraveT0Url(episode.id));
                    }}
                    className="rounded-md border border-navy-900/12 bg-white px-4 py-2 text-xs font-medium text-navy-800 hover:bg-navy-50"
                  >
                    {episode.initial_assessment
                      ? "Abrir Avaliação T0"
                      : "Avaliação T0"}
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
                disabled={loading}
                className="flex-1 rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
