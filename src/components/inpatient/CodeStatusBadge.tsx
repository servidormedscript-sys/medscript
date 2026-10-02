"use client";

import {
  codeStatusLabel,
  isRestrictedCodeStatus,
  type CodeStatus,
} from "@/lib/inpatient/code-status";

type Props = {
  status: CodeStatus;
  compact?: boolean;
};

export default function CodeStatusBadge({ status, compact }: Props) {
  if (!isRestrictedCodeStatus(status)) return null;

  return (
    <span
      className={`rounded-full border border-red-300 bg-red-100 font-semibold text-red-900 ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      }`}
      title="Status de código"
    >
      {compact ? "Código" : codeStatusLabel(status)}
    </span>
  );
}
