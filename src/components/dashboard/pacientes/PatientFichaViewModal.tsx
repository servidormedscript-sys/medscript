"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildEpisodeCareSummary } from "@/lib/patient-care-summary";
import type { EpisodeCareSummary } from "@/lib/patient-care-summary";
import type { KanbanEpisode, Patient, PatientEpisode } from "@/lib/types/patient";
import { RISK_LABELS, SEX_LABELS, STATUS_LABELS } from "@/lib/types/patient";
import { meuPacienteGraveT0Url } from "@/lib/dashboard/meu-paciente-grave-url";
import { formatAge } from "@/lib/utils/age";
import { formatCpf } from "@/lib/utils/cpf";
import PatientDocumentActions from "./PatientDocumentActions";
import PatientCareSummaryBadge from "./PatientCareSummaryBadge";
import StatusTimeDisplay from "./StatusTimeDisplay";

type FichaData = (KanbanEpisode | (PatientEpisode & { patient: Patient })) & {
  patient: Patient;
};

type PatientFichaViewModalProps = {
  episode: FichaData;
  onClose: () => void;
  onEdit?: () => void;
};

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-navy-800/55">{label}</dt>
      <dd
        className={`mt-1 text-sm text-navy-950 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export default function PatientFichaViewModal({
  episode,
  onClose,
  onEdit,
}: PatientFichaViewModalProps) {
  const router = useRouter();
  const patient = episode.patient;
  const ageLabel = patient.birth_date ? formatAge(patient.birth_date) : null;
  const [careSummary, setCareSummary] = useState<EpisodeCareSummary | null>(
    "care_summary" in episode ? episode.care_summary ?? null : null
  );

  useEffect(() => {
    if ("care_summary" in episode && episode.care_summary) {
      setCareSummary(episode.care_summary);
      return;
    }

    let cancelled = false;

    fetch(`/api/pacientes/episodios/${episode.id}/resumo`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.items) return;
        setCareSummary(buildEpisodeCareSummary(data.items, data.today));
      })
      .catch(() => {
        if (!cancelled) setCareSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [episode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-navy-900/10 bg-white shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-900/8 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-navy-950">
              Ficha cadastral
            </h2>
            <p className="text-sm text-navy-800/60">
              {patient.full_name} · Ficha #{episode.episode_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-navy-800/50 hover:text-navy-800"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-3 text-sm font-medium text-navy-950">
              Identificação
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" value={patient.full_name} />
              <Field label="CPF" value={formatCpf(patient.cpf)} />
              <Field
                label="Data de nascimento"
                value={
                  patient.birth_date
                    ? new Date(`${patient.birth_date}T00:00:00`).toLocaleDateString(
                        "pt-BR"
                      )
                    : null
                }
              />
              <Field label="Idade" value={ageLabel} />
              <Field
                label="Sexo"
                value={patient.sex ? SEX_LABELS[patient.sex] : null}
              />
            </dl>
          </section>

          <section className="border-t border-navy-900/8 pt-5">
            <h3 className="mb-3 text-sm font-medium text-navy-950">
              Dados clínicos
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Peso" value={episode.weight} />
              <Field label="Leito" value={episode.bed} />
              <div className="sm:col-span-2">
                <Field
                  label="Diagnóstico / motivo de internação"
                  value={episode.diagnosis}
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <Field label="Alergias" value={episode.allergies} multiline />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Medicações de uso domiciliar"
                  value={episode.medications}
                  multiline
                />
              </div>
            </dl>
          </section>

          <section className="border-t border-navy-900/8 pt-5">
            <h3 className="mb-3 text-sm font-medium text-navy-950">
              Situação atual
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Status no Kanban"
                value={STATUS_LABELS[episode.status]}
              />
              {episode.risk_level && (
                <Field
                  label="Classificação de risco"
                  value={RISK_LABELS[episode.risk_level]}
                />
              )}
            </dl>
          </section>

          <section className="border-t border-navy-900/8 pt-5">
            <h3 className="mb-3 text-sm font-medium text-navy-950">
              Tempos no Kanban
            </h3>
            <StatusTimeDisplay episode={episode} />
          </section>

          {careSummary && (
            <section className="border-t border-navy-900/8 pt-5">
              <h3 className="mb-3 text-sm font-medium text-navy-950">
                Resumo do paciente
              </h3>
              <PatientCareSummaryBadge summary={careSummary} />
              {careSummary.pendingExamCount === 0 &&
                careSummary.pendingMedDoseCount === 0 && (
                  <p className="text-sm text-navy-800/60">
                    Nenhuma pendência de exame ou medicamento para hoje.
                  </p>
                )}
            </section>
          )}

          {episode.initial_assessment && (
            <section className="border-t border-navy-900/8 pt-5">
              <h3 className="mb-3 text-sm font-medium text-navy-950">
                Laudo T0
              </h3>
              <p className="whitespace-pre-wrap rounded-md border border-navy-900/8 bg-navy-50/50 p-4 text-sm text-navy-800/80">
                {episode.initial_assessment}
              </p>
            </section>
          )}

          <section className="border-t border-navy-900/8 pt-5">
            <h3 className="mb-1 text-sm font-medium text-navy-950">
              Exportar / imprimir
            </h3>
            <p className="mb-3 text-xs text-navy-800/55">
              Ficha cadastral e avaliações em documentos separados, com logo
              MEDScript.
            </p>
            <PatientDocumentActions
              patientId={patient.id}
              episodeId={episode.id}
              patientName={patient.full_name}
              variant="panel"
            />
          </section>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-navy-900/8 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-navy-900/12 py-2.5 text-sm font-medium text-navy-800"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(meuPacienteGraveT0Url(episode.id));
            }}
            className="flex-1 rounded-md border border-navy-900/12 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-50"
          >
            Avaliação T0
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
            >
              Editar ficha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
