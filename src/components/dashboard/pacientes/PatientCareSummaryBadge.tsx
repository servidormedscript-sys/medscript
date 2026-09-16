import type { EpisodeCareSummary } from "@/lib/patient-care-summary";

type PatientCareSummaryBadgeProps = {
  summary?: EpisodeCareSummary;
  compact?: boolean;
};

export default function PatientCareSummaryBadge({
  summary,
  compact = false,
}: PatientCareSummaryBadgeProps) {
  if (
    !summary ||
    (summary.pendingExamCount === 0 && summary.pendingMedDoseCount === 0)
  ) {
    return null;
  }

  const overdueMedCount = summary.pendingMedDoses.filter((dose) => dose.is_overdue).length;

  const examLabel =
    summary.pendingExamCount === 1
      ? "1 exame pendente"
      : `${summary.pendingExamCount} exames pendentes`;

  const medLabel =
    overdueMedCount > 0
      ? overdueMedCount === 1
        ? "1 dose em atraso"
        : `${overdueMedCount} doses em atraso`
      : summary.pendingMedDoseCount === 1
        ? "1 dose pendente"
        : `${summary.pendingMedDoseCount} doses pendentes`;

  if (compact) {
    return (
      <div
        className={`mb-2 space-y-1 rounded border px-2 py-1.5 ${
          overdueMedCount > 0
            ? "border-red-200 bg-red-50/80"
            : "border-amber-200 bg-amber-50/80"
        }`}
      >
        {summary.pendingExamCount > 0 && (
          <p className="text-[11px] font-medium text-amber-900">{examLabel}</p>
        )}
        {summary.pendingMedDoseCount > 0 && (
          <p
            className={`text-[11px] font-medium ${
              overdueMedCount > 0 ? "text-red-900" : "text-amber-900"
            }`}
          >
            {medLabel}
          </p>
        )}
        {(summary.pendingExams[0] || summary.pendingMedDoses[0]) && (
          <p
            className={`text-[10px] ${
              overdueMedCount > 0 ? "text-red-900/75" : "text-amber-900/75"
            }`}
          >
            {[
              summary.pendingExams[0]?.title,
              summary.pendingMedDoses[0]
                ? `${summary.pendingMedDoses[0].medication} ${summary.pendingMedDoses[0].schedule_time}${
                    summary.pendingMedDoses[0].overdue_label
                      ? ` (${summary.pendingMedDoses[0].overdue_label})`
                      : ""
                  }`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/70 p-3">
      <p className="text-sm font-medium text-amber-950">Pendências do resumo</p>
      {summary.pendingExamCount > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-900">{examLabel}</p>
          <ul className="mt-1 space-y-1 text-xs text-amber-900/80">
            {summary.pendingExams.map((exam) => (
              <li key={exam.title}>
                • {exam.title}
                {exam.scheduled_for &&
                  ` (${new Date(exam.scheduled_for).toLocaleString("pt-BR")})`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.pendingMedDoseCount > 0 && (
        <div>
          <p
            className={`text-xs font-medium ${
              overdueMedCount > 0 ? "text-red-900" : "text-amber-900"
            }`}
          >
            {medLabel}
          </p>
          <ul className="mt-1 space-y-1 text-xs">
            {summary.pendingMedDoses.map((dose) => (
              <li
                key={`${dose.medication}-${dose.schedule_time}`}
                className={dose.is_overdue ? "text-red-900/85" : "text-amber-900/80"}
              >
                • {dose.medication} — {dose.schedule_time}
                {dose.overdue_label ? ` (${dose.overdue_label})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
