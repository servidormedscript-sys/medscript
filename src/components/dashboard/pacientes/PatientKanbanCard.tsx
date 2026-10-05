import Link from "next/link";
import { inpatientChartUrl } from "@/lib/dashboard/inpatient-chart-url";
import type { InpatientChartTabId } from "@/lib/inpatient/chart-tabs";
import CodeStatusBadge from "@/components/inpatient/CodeStatusBadge";
import type { KanbanEpisode, RiskLevel } from "@/lib/types/patient";
import { RISK_LABELS } from "@/lib/types/patient";
import StatusTimeDisplay from "./StatusTimeDisplay";
import PatientCareSummaryBadge from "./PatientCareSummaryBadge";

type PatientKanbanCardProps = {
  episode: KanbanEpisode;
  onMove: () => void;
  onPromote?: () => void;
  onView: () => void;
  onDragStart?: (episode: KanbanEpisode) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
};

const RISK_BADGE: Record<RiskLevel, string> = {
  alto: "bg-red-100 text-red-800 border-red-200",
  medio: "bg-amber-100 text-amber-900 border-amber-200",
  baixo: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PatientKanbanCard({
  episode,
  onMove,
  onPromote,
  onView,
  onDragStart,
  onDragEnd,
  isDragging,
}: PatientKanbanCardProps) {
  const patient = episode.patient;
  const showChart =
    episode.status === "internado" ||
    episode.status === "alta_recente" ||
    episode.status === "em_observacao";

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", episode.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(episode);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`cursor-grab rounded-md border border-navy-900/8 bg-navy-50/50 p-3 transition-shadow active:cursor-grabbing ${
        isDragging ? "opacity-40 shadow-none" : "hover:shadow-sm"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-navy-950">
          {patient?.full_name}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="shrink-0 rounded-md border border-navy-900/10 bg-white p-1.5 text-navy-800/60 transition-colors hover:border-navy-900/20 hover:text-navy-900"
          title="Ver ficha completa"
          aria-label="Ver ficha completa"
        >
          <IconEye className="h-4 w-4" />
        </button>
      </div>

      {episode.bed && (
        <p className="mb-2 text-xs text-navy-800/60">Leito {episode.bed}</p>
      )}

      {(episode.clinical_status || episode.code_status) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {episode.code_status && (
            <CodeStatusBadge status={episode.code_status} compact />
          )}
          {episode.clinical_status && (
            <>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${RISK_BADGE[episode.clinical_status.risk]}`}
              >
                {RISK_LABELS[episode.clinical_status.risk]}
              </span>
              <span className="rounded-full border border-navy-900/12 bg-white px-2 py-0.5 text-[10px] font-medium text-navy-800">
                Alta {episode.clinical_status.discharge_met}/
                {episode.clinical_status.discharge_total}
              </span>
            </>
          )}
        </div>
      )}

      <StatusTimeDisplay episode={episode} compact />

      {episode.clinical_status?.discharge_prediction &&
        !episode.clinical_status.discharge_prediction.suppressed && (
          <p className="mb-2 text-[11px] font-medium text-navy-900">
            Previsão de alta:{" "}
            {episode.clinical_status.discharge_prediction.min_days}–
            {episode.clinical_status.discharge_prediction.max_days} dias
          </p>
        )}
      {episode.clinical_status?.discharge_prediction?.suppressed && (
        <p className="mb-2 text-[11px] text-navy-800/65">
          {episode.clinical_status.discharge_prediction.suppressed_reason}
        </p>
      )}

      {(episode.clinical_status?.next_steps?.length ?? 0) > 0 ? (
        <ul className="mb-2 space-y-1 text-[11px] text-navy-800/80">
          {episode.clinical_status!.next_steps!.map((step) => (
            <li key={step.id} className="flex gap-1">
              <span aria-hidden>
                {step.priority === "urgent"
                  ? "🔴"
                  : step.priority === "positive"
                    ? "🟢"
                    : "🟡"}
              </span>
              <Link
                href={inpatientChartUrl(
                  episode.id,
                  step.tab as InpatientChartTabId,
                )}
                className="line-clamp-2 underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {step.text}
              </Link>
            </li>
          ))}
        </ul>
      ) : episode.clinical_status?.next_step_preview ? (
        <p className="mb-2 line-clamp-2 text-[11px] text-navy-800/75">
          → {episode.clinical_status.next_step_preview}
        </p>
      ) : null}

      <PatientCareSummaryBadge summary={episode.care_summary} compact />

      {episode.status === "em_observacao" && onPromote && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPromote();
          }}
          className="mb-2 w-full rounded border border-navy-900/15 bg-white py-1.5 text-xs font-medium text-navy-900 hover:bg-navy-50"
        >
          Promover para internação
        </button>
      )}

      {showChart && (
        <Link
          href={inpatientChartUrl(episode.id)}
          className="mt-2 block w-full rounded border border-navy-900/12 bg-navy-900 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-navy-800"
          onClick={(e) => e.stopPropagation()}
        >
          Prontuário
        </Link>
      )}

      <button
        type="button"
        onClick={onMove}
        className="mt-2 w-full rounded border border-navy-900/12 bg-white py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-navy-50"
      >
        Movimentar
      </button>
    </article>
  );
}
