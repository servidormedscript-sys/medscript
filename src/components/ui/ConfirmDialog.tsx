"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-med-red text-white hover:bg-red-700"
      : "bg-ocean-800 text-white hover:bg-ocean-700";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        disabled={loading}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-2xl shadow-navy-950/20">
        <div className="border-b border-navy-900/8 bg-gradient-to-r from-ocean-50/80 to-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ocean-800/70">
            Confirmação
          </p>
          <h2 id="confirm-dialog-title" className="mt-1 text-lg font-semibold text-navy-950">
            {title}
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-navy-800/75">{description}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-navy-900/8 bg-navy-50/40 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-full border border-navy-900/12 bg-white px-5 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-navy-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
