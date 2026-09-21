"use client";

import { useState } from "react";
import type { FormSection } from "@/lib/clinical/t0-form-config";
import { T0SectionIcon } from "@/lib/clinical/t0-section-icons";

type Props = {
  section: FormSection;
  values: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
  optional?: boolean;
  labelPrefix?: string;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

export default function CollapsibleCheckboxSection({
  section,
  values,
  onChange,
  optional,
  labelPrefix = "Possui:",
  readOnly = false,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const count = section.items.filter((i) => values[i.id]).length;

  return (
    <section className="rounded-lg border border-navy-900/8 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <T0SectionIcon sectionId={section.id} />
        <span className="flex-1 pt-1.5">
          <span className="text-sm font-medium text-navy-950">
            {section.title}
            {optional && (
              <span className="ml-2 text-xs font-normal text-navy-800/50">(opcional)</span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-navy-800/55">
            {count} de {section.items.length} marcado(s)
          </span>
        </span>
        <span className="text-xs text-navy-800/50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="space-y-2 border-t border-navy-900/8 px-5 pb-4 pt-3">
          {section.items.map((item) => (
            <li key={item.id}>
              <label
                className={`flex items-start gap-3 text-sm text-navy-800/80${
                  readOnly ? "" : " cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={values[item.id] ?? false}
                  onChange={(e) => onChange(item.id, e.target.checked)}
                  disabled={readOnly}
                  className="mt-0.5 h-4 w-4 rounded border-navy-900/20 disabled:cursor-default"
                />
                <span>
                  {labelPrefix} {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
