"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildTrackWithProgress,
  getTrackSummary,
} from "@/lib/emergency-school/progress-logic";
import type { PhaseWithState, SchoolProgressRecord } from "@/lib/emergency-school/types";
import type { UserType } from "@/lib/types/profile";

const userTypeLabels: Record<UserType, string> = {
  plantonista: "Plantonista",
  estudante: "Estudante",
};

type EmergencySchoolAppProps = {
  isAdmin: boolean;
  userType: UserType | null;
};

function UserBadge({ isAdmin, userType }: EmergencySchoolAppProps) {
  if (isAdmin) {
    return (
      <span className="inline-flex items-center rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-900 ring-1 ring-ocean-200">
        Administrador
      </span>
    );
  }

  if (userType) {
    const tone =
      userType === "estudante"
        ? "bg-violet-100 text-violet-900 ring-violet-200"
        : "bg-amber-100 text-amber-900 ring-amber-200";

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}
      >
        {userTypeLabels[userType]}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-800 ring-1 ring-navy-200">
      Sub-usuário
    </span>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-ocean-100"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-med-red transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-navy-900">{percent}%</span>
        <span className="text-[10px] uppercase tracking-wide text-navy-800/50">
          concluído
        </span>
      </div>
    </div>
  );
}

function ModuleCard({
  module,
  onUpdate,
  updatingId,
}: {
  module: PhaseWithState["modules"][number];
  onUpdate: (moduleId: string, status: "in_progress" | "completed") => void;
  updatingId: string | null;
}) {
  const isUpdating = updatingId === module.id;
  const locked = module.status === "locked";
  const completed = module.status === "completed";

  const protocolHref = module.relatedProtocolCategoryId
    ? module.relatedProtocolIds?.length
      ? `/dashboard/protocolos-clinicos?category=${module.relatedProtocolCategoryId}&protocol=${module.relatedProtocolIds[0]}`
      : `/dashboard/protocolos-clinicos?category=${module.relatedProtocolCategoryId}`
    : null;

  return (
    <article
      className={`rounded-2xl border p-5 transition-shadow ${
        locked
          ? "border-navy-900/8 bg-navy-50/40 opacity-75"
          : completed
            ? "border-green-200 bg-green-50/40 shadow-sm"
            : "border-ocean-100 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-navy-900">{module.title}</h3>
            {module.durationLabel ? (
              <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[11px] font-medium text-ocean-800">
                {module.durationLabel}
              </span>
            ) : null}
            {completed ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                Concluído
              </span>
            ) : null}
            {module.status === "in_progress" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                Em andamento
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-navy-800/70">
            {module.description}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {module.objectives.map((objective) => (
          <li
            key={objective}
            className="flex gap-2 text-sm text-navy-800/75"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-med-red" />
            {objective}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {!locked && !completed ? (
          <>
            {module.status === "available" ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdate(module.id, "in_progress")}
                className="rounded-full border border-ocean-200 bg-white px-4 py-2 text-xs font-semibold text-ocean-900 transition hover:bg-ocean-50 disabled:opacity-60"
              >
                {isUpdating ? "Salvando..." : "Iniciar módulo"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdate(module.id, "completed")}
              className="rounded-full bg-ocean-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
            >
              {isUpdating ? "Salvando..." : "Marcar como concluído"}
            </button>
          </>
        ) : null}
        {protocolHref && !locked ? (
          <Link
            href={protocolHref}
            className="rounded-full border border-navy-900/10 bg-navy-50 px-4 py-2 text-xs font-semibold text-navy-900 transition hover:bg-navy-100"
          >
            Ver protocolos relacionados
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function EmergencySchoolApp({
  isAdmin,
  userType,
}: EmergencySchoolAppProps) {
  const [progress, setProgress] = useState<SchoolProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/escola-emergencia/progress");
      const payload = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text:
            payload.error ??
            "Erro ao carregar a trilha. Verifique se a migration 014 foi aplicada no Supabase.",
        });
        setProgress([]);
        return;
      }

      setProgress((payload.progress ?? []) as SchoolProgressRecord[]);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar a trilha." });
      setProgress([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const phases = useMemo(
    () => buildTrackWithProgress(progress),
    [progress]
  );
  const summary = useMemo(() => getTrackSummary(phases), [phases]);

  async function handleUpdate(
    moduleId: string,
    status: "in_progress" | "completed"
  ) {
    setUpdatingId(moduleId);
    setMessage(null);

    try {
      const res = await fetch("/api/escola-emergencia/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, status }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: payload.error ?? "Não foi possível salvar o progresso.",
        });
        return;
      }

      await loadProgress();
      if (status === "completed") {
        setMessage({ type: "success", text: "Módulo concluído. Próximo passo liberado!" });
      }
    } catch {
      setMessage({ type: "error", text: "Não foi possível salvar o progresso." });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-ocean-100 bg-gradient-to-br from-white via-ocean-50/40 to-navy-50 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <UserBadge isAdmin={isAdmin} userType={userType} />
            <h2 className="text-2xl font-bold text-navy-900">
              Sua trilha de desenvolvimento
            </h2>
            <p className="text-sm leading-relaxed text-navy-800/70">
              Percorra os módulos em sequência, do atendimento inicial à integração
              no plantão. Plantonistas e estudantes têm acesso completo à trilha e
              aos protocolos da plataforma.
            </p>
            <p className="text-xs text-navy-800/50">
              {summary.completedModules} de {summary.totalModules} módulos concluídos
            </p>
          </div>
          <ProgressRing percent={summary.percent} />
        </div>
      </section>

      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-navy-800/60">Carregando trilha...</p>
      ) : (
        <div className="space-y-10">
          {phases.map((phase, phaseIndex) => (
            <section key={phase.id} className="relative">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ocean-800/60">
                    Etapa {phase.order}
                  </p>
                  <h3 className="text-xl font-bold text-navy-900">{phase.title}</h3>
                  <p className="mt-1 text-sm text-navy-800/65">{phase.subtitle}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-800 ring-1 ring-ocean-100">
                  {phase.completedCount}/{phase.totalCount} módulos
                </span>
              </div>

              <div className="relative pl-6 md:pl-8">
                <div
                  className={`absolute bottom-0 left-2 top-0 w-0.5 rounded-full bg-gradient-to-b ${phase.accentClass} opacity-30 md:left-3`}
                  aria-hidden="true"
                />
                <div className="space-y-4">
                  {phase.modules.map((module) => (
                    <div key={module.id} className="relative">
                      <span
                        className={`absolute -left-[1.35rem] top-6 flex h-3 w-3 rounded-full ring-4 ring-white md:-left-[1.6rem] ${
                          module.status === "completed"
                            ? "bg-green-500"
                            : module.status === "in_progress"
                              ? "bg-amber-500"
                              : module.status === "available"
                                ? "bg-med-red"
                                : "bg-navy-200"
                        }`}
                        aria-hidden="true"
                      />
                      <ModuleCard
                        module={module}
                        onUpdate={handleUpdate}
                        updatingId={updatingId}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {phaseIndex < phases.length - 1 ? (
                <div className="mt-8 border-t border-dashed border-ocean-100" />
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
