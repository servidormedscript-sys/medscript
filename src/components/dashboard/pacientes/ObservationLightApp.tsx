"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inpatientChartUrl } from "@/lib/dashboard/inpatient-chart-url";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { SEX_LABELS, STATUS_LABELS } from "@/lib/types/patient";
import { formatAge } from "@/lib/utils/age";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

type Props = {
  episode: PatientEpisode;
  patient: Patient;
};

export default function ObservationLightApp({ episode, patient }: Props) {
  const router = useRouter();
  const [bed, setBed] = useState(episode.bed ?? "");
  const [diagnosis, setDiagnosis] = useState(episode.diagnosis ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const age = patient.birth_date ? formatAge(patient.birth_date) : null;

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/pacientes/episodios/${episode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bed: bed.trim() || null,
        diagnosis: diagnosis.trim() || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Não foi possível salvar.");
      return;
    }
    setMessage("Dados da observação atualizados.");
  }

  if (episode.status !== "em_observacao") {
    return (
      <div className="rounded-lg border border-navy-900/10 bg-white p-6">
        <p className="text-sm text-navy-800/70">
          Este paciente não está mais em observação.
        </p>
        <Link
          href={inpatientChartUrl(episode.id)}
          className="mt-3 inline-block text-sm font-medium text-navy-900 underline"
        >
          Abrir prontuário
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="rounded-lg border border-navy-900/10 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-navy-800/50">
          Observação leve
        </p>
        <h1 className="mt-1 text-xl font-semibold text-navy-950">
          {patient.full_name}
        </h1>
        <p className="mt-2 text-sm text-navy-800/70">
          {[age, patient.sex ? SEX_LABELS[patient.sex] : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-sm text-navy-800/60">
          Status: {STATUS_LABELS.em_observacao} — sem prontuário completo até
          promover para internação.
        </p>
      </header>

      {message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-navy-900/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy-950">Box / motivo</h2>
        <label className="block text-xs text-navy-800/70">
          Leito ou box
          <input
            className={`${inputClass} mt-1`}
            value={bed}
            onChange={(e) => setBed(e.target.value)}
            placeholder="Ex.: Box 3, Sala de observação"
          />
        </label>
        <label className="block text-xs text-navy-800/70">
          Motivo da observação
          <textarea
            className={`${inputClass} mt-1 min-h-[100px]`}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Queixa principal / motivo da permanência em observação"
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar observação"}
        </button>
      </section>

      <section className="rounded-lg border border-dashed border-navy-900/15 bg-navy-50/40 p-5">
        <h2 className="text-sm font-semibold text-navy-950">Próximo passo</h2>
        <p className="mt-2 text-sm text-navy-800/70">
          Quando precisar de prescrição, evolução, exames ou CORE, promova o
          paciente para <strong>Internado</strong> no Kanban. Uma evolução de
          transição será registrada automaticamente.
        </p>
        <Link
          href="/dashboard/relatorio-pacientes?tab=kanban"
          className="mt-4 inline-block rounded-md border border-navy-900/15 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-white"
        >
          Voltar ao Kanban para promover
        </Link>
      </section>

      <p className="text-center text-xs text-navy-800/50">
        <button
          type="button"
          className="underline"
          onClick={() => router.refresh()}
        >
          Atualizar página
        </button>
        {" · "}
        <Link href="/dashboard/relatorio-pacientes" className="underline">
          Relatório de pacientes
        </Link>
      </p>
    </div>
  );
}
