"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { KanbanEpisode, PatientStatus } from "@/lib/types/patient";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import {
  ALLOWED_TRANSITIONS,
  KANBAN_COLUMNS,
  STATUS_LABELS,
} from "@/lib/types/patient";
import PatientKanbanCard from "./PatientKanbanCard";
import MovePatientModal from "./MovePatientModal";
import NewPatientModal from "./NewPatientModal";
import PatientCadastroPanel from "./PatientCadastroPanel";
import PatientFichaViewModal from "./PatientFichaViewModal";
import PatientFichasManager from "./PatientFichasManager";
import PatientSummaryPanel from "./PatientSummaryPanel";
import BedMapPanel from "./BedMapPanel";
import EditPatientFichaModal from "./EditPatientFichaModal";
import InpatientSpecialtyChart from "@/components/inpatient/InpatientSpecialtyChart";
import { buildSpecialtyChart } from "@/lib/inpatient/specialty-aggregation";
import {
  episodeMatchesSpecialtyFilter,
  specialtyLabel,
} from "@/lib/inpatient/specialty";

type KanbanData = Record<PatientStatus, KanbanEpisode[]>;

const emptyKanban = (): KanbanData => ({
  triagem: [],
  em_observacao: [],
  internado: [],
  alta_recente: [],
  arquivado: [],
});

function findEpisode(kanban: KanbanData, episodeId: string): KanbanEpisode | null {
  for (const status of KANBAN_COLUMNS) {
    const found = kanban[status]?.find((ep) => ep.id === episodeId);
    if (found) return found;
  }
  return null;
}

export default function PatientKanbanBoard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "kanban" | "mapa-leitos" | "desarquivamento" | "fichas" | "resumo"
  >("kanban");
  const [prefillBed, setPrefillBed] = useState<{
    id: string;
    code: string;
    unit: string;
  } | null>(null);
  const [resumoEpisodeId, setResumoEpisodeId] = useState<string | undefined>();
  const [kanban, setKanban] = useState<KanbanData>(emptyKanban);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientLockStatus, setNewPatientLockStatus] = useState<
    PatientStatus | undefined
  >(undefined);
  const [moveEpisode, setMoveEpisode] = useState<KanbanEpisode | null>(null);
  const [moveTargetStatus, setMoveTargetStatus] = useState<PatientStatus | null>(
    null
  );
  const [draggingEpisodeId, setDraggingEpisodeId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PatientStatus | null>(null);
  const [viewEpisode, setViewEpisode] = useState<KanbanEpisode | null>(null);
  const [editEpisode, setEditEpisode] = useState<KanbanEpisode | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const loadKanban = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pacientes");
      const data = await res.json();
      if (res.ok) {
        setKanban({ ...emptyKanban(), ...data.kanban });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKanban();
  }, [loadKanban]);

  useClinicRealtime(loadKanban);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const episode = searchParams.get("episode");

    if (
      tab === "kanban" ||
      tab === "mapa-leitos" ||
      tab === "desarquivamento" ||
      tab === "fichas" ||
      tab === "resumo"
    ) {
      setActiveTab(tab);
    }

    if (episode) {
      setResumoEpisodeId(episode);
    }

    if (searchParams.get("internar") === "1") {
      setShowNewPatient(true);
    }

    const specialty = searchParams.get("specialty");
    if (specialty) {
      setSpecialtyFilter(specialty);
    }
  }, [searchParams]);

  const specialtyChartRows = useMemo(
    () =>
      buildSpecialtyChart(
        (kanban.internado ?? []).map((ep) => ({
          status: ep.status,
          care_specialty: ep.care_specialty,
          diagnosis: ep.diagnosis,
          clinical_risk: ep.clinical_status?.risk ?? ep.risk_level ?? "baixo",
        })),
      ),
    [kanban.internado],
  );

  const displayKanban = useMemo(() => {
    if (!specialtyFilter) return kanban;
    const next = emptyKanban();
    for (const status of KANBAN_COLUMNS) {
      next[status] = (kanban[status] ?? []).filter((ep) =>
        episodeMatchesSpecialtyFilter(ep, specialtyFilter),
      );
    }
    return next;
  }, [kanban, specialtyFilter]);

  const draggingEpisode = useMemo(
    () => (draggingEpisodeId ? findEpisode(kanban, draggingEpisodeId) : null),
    [draggingEpisodeId, kanban]
  );

  function openMoveModal(
    episode: KanbanEpisode,
    targetStatus?: PatientStatus
  ) {
    setMoveEpisode(episode);
    setMoveTargetStatus(targetStatus ?? null);
  }

  function closeMoveModal() {
    setMoveEpisode(null);
    setMoveTargetStatus(null);
  }

  function canDropOnColumn(
    fromStatus: PatientStatus,
    toColumn: PatientStatus
  ): boolean {
    if (fromStatus === toColumn) return false;
    return ALLOWED_TRANSITIONS[fromStatus]?.includes(toColumn) ?? false;
  }

  function handleColumnDragOver(
    e: React.DragEvent,
    columnStatus: PatientStatus
  ) {
    e.preventDefault();
    if (!draggingEpisode) return;

    if (canDropOnColumn(draggingEpisode.status, columnStatus)) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn(columnStatus);
    } else {
      e.dataTransfer.dropEffect = "none";
      setDragOverColumn(null);
    }
  }

  function handleColumnDrop(e: React.DragEvent, columnStatus: PatientStatus) {
    e.preventDefault();
    setDragOverColumn(null);

    const episodeId = e.dataTransfer.getData("text/plain");
    const episode = findEpisode(kanban, episodeId);

    if (!episode) return;

    if (!canDropOnColumn(episode.status, columnStatus)) {
      setMessage({
        type: "error",
        text: `Não é possível mover de ${STATUS_LABELS[episode.status]} para ${STATUS_LABELS[columnStatus]}.`,
      });
      return;
    }

    openMoveModal(episode, columnStatus);
    setDraggingEpisodeId(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 border-b border-navy-900/8">
          <button
            type="button"
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "kanban"
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mapa-leitos")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "mapa-leitos"
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            Mapa de Leitos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desarquivamento")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "desarquivamento"
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            Desarquivamento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fichas")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "fichas"
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            Fichas Cadastrais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resumo")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "resumo"
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            Resumo dos Pacientes
          </button>
        </div>

        {activeTab === "kanban" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setNewPatientLockStatus(undefined);
              setShowNewPatient(true);
            }}
            className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Novo paciente
          </button>
          <button
            type="button"
            onClick={() => {
              setNewPatientLockStatus("em_observacao");
              setShowNewPatient(true);
            }}
            className="rounded-md border border-navy-900/15 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Observação leve
          </button>
        </div>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === "kanban" ? (
        loading ? (
          <p className="text-sm text-navy-800/60">Carregando kanban...</p>
        ) : (
          <>
            <p className="mb-4 text-xs text-navy-800/50">
              Arraste o card para outra coluna ou use o botão Movimentar para
              preencher o relatório.
            </p>
            {specialtyChartRows.length > 0 && (
              <div className="mb-6 rounded-lg border border-navy-900/8 bg-white p-4">
                <h3 className="text-sm font-medium text-navy-950">
                  Internados por especialidade
                </h3>
                <p className="mt-1 text-xs text-navy-800/55">
                  Clique em uma barra para filtrar o Kanban (coluna Internado e
                  demais colunas, se o paciente corresponder).
                </p>
                <div className="mt-3 max-w-xl">
                  <InpatientSpecialtyChart
                    rows={specialtyChartRows}
                    compact
                    highlightSpecialty={specialtyFilter || null}
                    onSelectSpecialty={(key) =>
                      setSpecialtyFilter(key ?? "")
                    }
                  />
                </div>
                {specialtyFilter && (
                  <p className="mt-2 text-xs text-navy-800/60">
                    Filtro ativo:{" "}
                    <span className="font-medium text-navy-900">
                      {specialtyLabel(specialtyFilter)}
                    </span>
                    .{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setSpecialtyFilter("")}
                    >
                      Limpar
                    </button>
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-4 xl:grid-cols-4">
              {KANBAN_COLUMNS.map((status) => {
                const isDropTarget =
                  dragOverColumn === status &&
                  draggingEpisode &&
                  canDropOnColumn(draggingEpisode.status, status);

                return (
                  <div
                    key={status}
                    onDragOver={(e) => handleColumnDragOver(e, status)}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => handleColumnDrop(e, status)}
                    className={`flex min-h-[420px] flex-col rounded-lg border bg-white transition-colors ${
                      isDropTarget
                        ? "border-navy-700 bg-navy-50 ring-2 ring-navy-700/20"
                        : "border-navy-900/8"
                    }`}
                  >
                    <div className="border-b border-navy-900/8 px-4 py-3">
                      <h3 className="text-sm font-medium text-navy-950">
                        {STATUS_LABELS[status]}
                      </h3>
                      <p className="text-xs text-navy-800/50">
                        {displayKanban[status]?.length ?? 0} paciente(s)
                      </p>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                      {(displayKanban[status] ?? []).map((episode) => (
                        <PatientKanbanCard
                          key={episode.id}
                          episode={episode}
                          onMove={() => openMoveModal(episode)}
                          onPromote={
                            episode.status === "em_observacao"
                              ? () => openMoveModal(episode, "internado")
                              : undefined
                          }
                          onView={() => setViewEpisode(episode)}
                          onDragStart={(ep) => setDraggingEpisodeId(ep.id)}
                          onDragEnd={() => {
                            setDraggingEpisodeId(null);
                            setDragOverColumn(null);
                          }}
                          isDragging={draggingEpisodeId === episode.id}
                        />
                      ))}
                      {(displayKanban[status] ?? []).length === 0 && (
                        <p className="py-8 text-center text-xs text-navy-800/40">
                          {draggingEpisode &&
                          canDropOnColumn(draggingEpisode.status, status)
                            ? "Solte aqui"
                            : "Nenhum paciente"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : activeTab === "mapa-leitos" ? (
        <BedMapPanel
          specialtyFilter={specialtyFilter}
          onSpecialtyFilterChange={setSpecialtyFilter}
          onInternarAqui={(bed) => {
            setPrefillBed(bed);
            setNewPatientLockStatus("internado");
            setShowNewPatient(true);
          }}
        />
      ) : activeTab === "desarquivamento" ? (
        <PatientCadastroPanel
          onReactivated={() => {
            setMessage({
              type: "success",
              text: "Paciente reativado e encaminhado para triagem.",
            });
            loadKanban();
            setActiveTab("kanban");
          }}
        />
      ) : activeTab === "fichas" ? (
        <PatientFichasManager />
      ) : (
        <PatientSummaryPanel initialEpisodeId={resumoEpisodeId} />
      )}

      {showNewPatient && (
        <NewPatientModal
          lockInitialStatus={
            prefillBed ? "internado" : newPatientLockStatus
          }
          initialOrganizationBed={prefillBed ?? undefined}
          onClose={() => {
            setShowNewPatient(false);
            setPrefillBed(null);
            setNewPatientLockStatus(undefined);
          }}
          onCreated={() => {
            const internedInBed = prefillBed;
            const wasObservation = newPatientLockStatus === "em_observacao";
            setShowNewPatient(false);
            setPrefillBed(null);
            setNewPatientLockStatus(undefined);
            setMessage({
              type: "success",
              text: internedInBed
                ? "Paciente internado no leito selecionado."
                : wasObservation
                  ? "Paciente cadastrado em observação leve."
                  : "Paciente cadastrado em triagem.",
            });
            loadKanban();
          }}
          onError={(text) => setMessage({ type: "error", text })}
        />
      )}

      {moveEpisode && (
        <MovePatientModal
          episode={moveEpisode}
          defaultToStatus={moveTargetStatus ?? undefined}
          onClose={closeMoveModal}
          onMoved={() => {
            closeMoveModal();
            setMessage({ type: "success", text: "Paciente movimentado com sucesso." });
            loadKanban();
          }}
          onError={(text) => setMessage({ type: "error", text })}
        />
      )}

      {viewEpisode && (
        <PatientFichaViewModal
          episode={viewEpisode}
          onClose={() => setViewEpisode(null)}
          onEdit={() => {
            setEditEpisode(viewEpisode);
            setViewEpisode(null);
          }}
        />
      )}

      {editEpisode && (
        <EditPatientFichaModal
          episode={editEpisode}
          onClose={() => setEditEpisode(null)}
          onSaved={() => {
            setEditEpisode(null);
            setMessage({ type: "success", text: "Ficha atualizada com sucesso." });
            loadKanban();
          }}
          onError={(text) => setMessage({ type: "error", text })}
        />
      )}
    </div>
  );
}
