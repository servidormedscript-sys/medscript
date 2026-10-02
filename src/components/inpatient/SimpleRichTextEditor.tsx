"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export default function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Digite a evolução...",
  minHeight = "220px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastEmitted.current && el.innerHTML !== value) {
      el.innerHTML = value || "";
      lastEmitted.current = value;
    }
  }, [value]);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }, [onChange]);

  function exec(cmd: string) {
    document.execCommand(cmd, false);
    ref.current?.focus();
    sync();
  }

  return (
    <div className="rounded-md border border-navy-900/12 bg-white">
      <div
        className="flex flex-wrap gap-1 border-b border-navy-900/8 px-2 py-1.5"
        role="toolbar"
        aria-label="Formatação"
      >
        <button
          type="button"
          onClick={() => exec("bold")}
          className="rounded px-2 py-1 text-xs font-bold text-navy-900 hover:bg-navy-50"
          title="Negrito"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="rounded px-2 py-1 text-xs italic text-navy-900 hover:bg-navy-50"
          title="Itálico"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="rounded px-2 py-1 text-xs underline text-navy-900 hover:bg-navy-50"
          title="Sublinhado"
        >
          U
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        className="prose prose-sm max-w-none px-3 py-3 text-sm text-navy-950 outline-none [&:empty]:before:pointer-events-none [&:empty]:before:text-navy-800/40 [&:empty]:before:content-[attr(data-placeholder)]"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={sync}
        suppressContentEditableWarning
      />
    </div>
  );
}

export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}
