import type { KanbanEpisode } from "@/lib/types/patient";
import StatusTimeDisplay from "./StatusTimeDisplay";
import PatientCareSummaryBadge from "./PatientCareSummaryBadge";

type PatientKanbanCardProps = {
  episode: KanbanEpisode;
  onMove: () => void;
  onView: () => void;
  onDragStart?: (episode: KanbanEpisode) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
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
  onView,
  onDragStart,
  onDragEnd,
  isDragging,
}: PatientKanbanCardProps) {
  const patient = episode.patient;

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

      <StatusTimeDisplay episode={episode} compact />

      <PatientCareSummaryBadge summary={episode.care_summary} compact />

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
