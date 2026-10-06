"use client";

import { useState } from "react";
import {
  extractImagingConclusion,
  extractLabValuesFromText,
  extractTextFromImageFile,
  extractTextFromPdfFile,
  type OcrExtractedValue,
} from "@/lib/inpatient/lab-ocr";

const inputClass =
  "w-full rounded-md border border-navy-900/12 bg-white px-2 py-1.5 text-sm text-navy-950 outline-none focus:border-navy-700";

type Props = {
  episodeId: string;
  compact?: boolean;
  onSaved?: () => void | Promise<void>;
  onError?: (message: string) => void;
};

export default function LabOcrImporter({
  episodeId,
  compact,
  onSaved,
  onError,
}: Props) {
  const [ocrReview, setOcrReview] = useState<OcrExtractedValue[] | null>(null);
  const [ocrImaging, setOcrImaging] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleOcrFile(file: File) {
    setOcrLoading(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPdfFile(file);
      } else if (file.type.startsWith("image/")) {
        text = await extractTextFromImageFile(file);
      } else {
        text = await file.text();
      }
      const extracted = extractLabValuesFromText(text);
      const img = extractImagingConclusion(text);
      setOcrReview(extracted);
      setOcrImaging(img);
      if (extracted.length === 0 && !img) {
        onError?.(
          "Não foi possível extrair exames com confiança — revise o arquivo ou digite manualmente na aba Exames.",
        );
      }
    } catch {
      onError?.("Falha ao processar o arquivo no navegador.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function confirmOcrReview() {
    if (!ocrReview?.length && !ocrImaging) return;
    setSaving(true);
    try {
      if (ocrReview?.length) {
        const entries = ocrReview
          .filter((r) => r.selected)
          .map((r) => ({ analyte_key: r.analyteKey, value: r.value }));
        const res = await fetch(
          `/api/pacientes/episodios/${episodeId}/exames-laboratorio`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collected_at: new Date().toISOString(),
              entries,
            }),
          },
        );
        if (!res.ok) {
          const data = await res.json();
          onError?.(data.error ?? "Erro ao salvar exames.");
          setSaving(false);
          return;
        }
      }
      if (ocrImaging?.trim()) {
        const res = await fetch(
          `/api/pacientes/episodios/${episodeId}/exames-laboratorio`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imaging: { body_text: ocrImaging },
            }),
          },
        );
        if (!res.ok) {
          const data = await res.json();
          onError?.(data.error ?? "Erro ao salvar laudo de imagem.");
          setSaving(false);
          return;
        }
      }
      setOcrReview(null);
      setOcrImaging(null);
      await onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <input
        type="file"
        accept="application/pdf,image/*,.txt"
        className="text-sm"
        disabled={ocrLoading || saving}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleOcrFile(f);
          e.target.value = "";
        }}
      />
      {ocrLoading && (
        <p className="text-sm text-navy-800/60">Processando OCR local...</p>
      )}

      {ocrReview && (
        <div className="rounded-md border border-ocean-200 bg-ocean-50/40 p-3">
          <p className="text-xs font-medium text-navy-950">Revisão da extração</p>
          <ul className="mt-2 space-y-2">
            {ocrReview.map((row, idx) => (
              <li
                key={row.analyteKey}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={row.selected}
                  onChange={(e) => {
                    const next = [...ocrReview];
                    next[idx] = { ...row, selected: e.target.checked };
                    setOcrReview(next);
                  }}
                />
                <span className="min-w-[8rem]">{row.label}</span>
                <input
                  className={`${inputClass} max-w-[6rem]`}
                  value={row.value}
                  onChange={(e) => {
                    const next = [...ocrReview];
                    next[idx] = {
                      ...row,
                      value: Number(e.target.value.replace(",", ".")),
                    };
                    setOcrReview(next);
                  }}
                />
              </li>
            ))}
          </ul>
          {ocrImaging && (
            <label className="mt-3 block text-xs">
              Laudo de imagem (editável)
              <textarea
                className={`${inputClass} mt-1 min-h-[80px]`}
                value={ocrImaging}
                onChange={(e) => setOcrImaging(e.target.value)}
              />
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={confirmOcrReview}
              className="rounded-md bg-navy-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Confirmar e salvar no prontuário"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOcrReview(null);
                setOcrImaging(null);
              }}
              className="rounded-md border border-navy-900/15 px-3 py-2 text-xs"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
