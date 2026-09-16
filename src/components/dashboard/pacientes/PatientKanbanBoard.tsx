"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { KanbanEpisode, PatientStatus } from "@/lib/types/patient";
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
import EditPatientFichaModal from "./EditPatientFichaModal";

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
    "kanban" | "desarquivamento" | "fichas" | "resumo"
  >("kanban");
  const [resumoEpisodeId, setResumoEpisodeId] = useState<string | undefined>();
  const [kanban, setKanban] = useState<KanbanData>(emptyKanban);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [moveEpisode, setMoveEpisode] = useState<KanbanEpisode | null>(null);
  const [moveTargetStatus, setMoveTargetStatus] = useState<PatientStatus | null>(
    null
  );
  const [draggingEpisodeId, setDraggingEpisodeId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PatientStatus | null>(null);
  const [viewEpisode, setViewEpisode] = useState<KanbanEpisode | null>(null);
  const [editEpisode, setEditEpisode] = useState<KanbanEpisode | null>(null);

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

  useEffect(() => {
    const tab = searchParams.get("tab");
    const episode = searchParams.get("episode");

    if (
      tab === "kanban" ||
      tab === "desarquivamento" ||
      tab === "fichas" ||
      tab === "resumo"
    ) {
      setActiveTab(tab);
    }

    if (episode) {
      setResumoEpisodeId(episode);
    }
  }, [searchParams]);

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
        <button
          type="button"
          onClick={() => setShowNewPatient(true)}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          Novo paciente
        </button>
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
                        {kanban[status]?.length ?? 0} paciente(s)
                      </p>
                    </div>
                    <div className="flex-1 space-y-3 p-3">
                      {(kanban[status] ?? []).map((episode) => (
                        <PatientKanbanCard
                          key={episode.id}
                          episode={episode}
                          onMove={() => openMoveModal(episode)}
                          onView={() => setViewEpisode(episode)}
                          onDragStart={(ep) => setDraggingEpisodeId(ep.id)}
                          onDragEnd={() => {
                            setDraggingEpisodeId(null);
                            setDragOverColumn(null);
                          }}
                          isDragging={draggingEpisodeId === episode.id}
                        />
                      ))}
                      {(kanban[status] ?? []).length === 0 && (
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
          onClose={() => setShowNewPatient(false)}
          onCreated={() => {
            setShowNewPatient(false);
            setMessage({ type: "success", text: "Paciente cadastrado em triagem." });
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
