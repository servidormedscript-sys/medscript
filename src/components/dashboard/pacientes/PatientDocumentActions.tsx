"use client";

import { useEffect, useRef, useState } from "react";
import { hasAssessments } from "@/lib/patient-documents/formatters";
import {
  downloadAssessmentsPdf,
  downloadFichaCadastralPdf,
  fetchPatientDocuments,
  printAssessments,
  printFichaCadastral,
} from "@/lib/patient-documents/export";

type PatientDocumentActionsProps = {
  patientId: string;
  episodeId?: string;
  patientName?: string;
  variant?: "menu" | "panel";
  onError?: (message: string) => void;
};

type ActionKey =
  | "print-ficha"
  | "pdf-ficha"
  | "print-assessments"
  | "pdf-assessments";

const MENU_ITEMS: {
  action: ActionKey;
  label: string;
  group: "ficha" | "avaliacoes";
}[] = [
  { action: "print-ficha", label: "Imprimir ficha cadastral", group: "ficha" },
  { action: "pdf-ficha", label: "Salvar ficha em PDF", group: "ficha" },
  {
    action: "print-assessments",
    label: "Imprimir avaliações",
    group: "avaliacoes",
  },
  {
    action: "pdf-assessments",
    label: "Salvar avaliações em PDF",
    group: "avaliacoes",
  },
];

export default function PatientDocumentActions({
  patientId,
  episodeId,
  patientName,
  variant = "menu",
  onError,
}: PatientDocumentActionsProps) {
  const [open, setOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function runAction(action: ActionKey) {
    setLoadingAction(action);
    setOpen(false);

    try {
      const bundle = await fetchPatientDocuments(patientId, episodeId);

      switch (action) {
        case "print-ficha":
          await printFichaCadastral(bundle);
          break;
        case "pdf-ficha":
          await downloadFichaCadastralPdf(bundle);
          break;
        case "print-assessments":
          if (!hasAssessments(bundle)) {
            throw new Error("Este paciente não possui avaliações registradas.");
          }
          await printAssessments(bundle);
          break;
        case "pdf-assessments":
          if (!hasAssessments(bundle)) {
            throw new Error("Este paciente não possui avaliações registradas.");
          }
          await downloadAssessmentsPdf(bundle);
          break;
      }
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Erro ao gerar documento do paciente."
      );
    } finally {
      setLoadingAction(null);
    }
  }

  const triggerLabel = loadingAction ? "Gerando..." : "Exportar";

  const triggerClass =
    variant === "menu"
      ? "rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50 disabled:opacity-50"
      : "rounded-md border border-navy-900/12 px-4 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50 disabled:opacity-50";

  function renderMenuItem(item: (typeof MENU_ITEMS)[number]) {
    return (
      <button
        key={item.action}
        type="button"
        disabled={Boolean(loadingAction)}
        onClick={() => runAction(item.action)}
        className="block w-full px-3 py-2 text-left text-xs text-navy-800 hover:bg-navy-50 disabled:opacity-50"
      >
        {loadingAction === item.action ? "Gerando..." : item.label}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={Boolean(loadingAction)}
        onClick={() => setOpen((value) => !value)}
        className={triggerClass}
        title={
          patientName
            ? `Exportar documentos de ${patientName}`
            : "Exportar documentos"
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {triggerLabel}
        <span className="ml-1 text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-1 overflow-hidden rounded-md border border-navy-900/10 bg-white shadow-lg ${
            variant === "menu" ? "right-0 w-52" : "left-0 w-56"
          }`}
        >
          <div className="border-b border-navy-900/8 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-navy-800/45">
            Ficha cadastral
          </div>
          {MENU_ITEMS.filter((item) => item.group === "ficha").map(renderMenuItem)}

          <div className="border-b border-t border-navy-900/8 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-navy-800/45">
            Avaliações
          </div>
          {MENU_ITEMS.filter((item) => item.group === "avaliacoes").map(
            renderMenuItem
          )}
        </div>
      )}
    </div>
  );
}
