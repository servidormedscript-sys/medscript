"use client";

import type { FormSection } from "@/lib/clinical/t0-form-config";
import { T0SectionIcon } from "@/lib/clinical/t0-section-icons";

type CheckboxSectionProps = {
  section: FormSection;
  values: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
  optional?: boolean;
  labelPrefix?: string;
  readOnly?: boolean;
};

export default function CheckboxSection({
  section,
  values,
  onChange,
  optional,
  labelPrefix = "O paciente possui:",
  readOnly = false,
}: CheckboxSectionProps) {
  return (
    <section className="rounded-lg border border-navy-900/8 bg-white p-5">
      <div className="mb-3 flex items-start gap-3">
        <T0SectionIcon sectionId={section.id} />
        <h3 className="pt-1.5 text-sm font-medium text-navy-950">
          {section.title}
          {optional && (
            <span className="ml-2 text-xs font-normal text-navy-800/50">
              (opcional)
            </span>
          )}
        </h3>
      </div>
      <ul className="space-y-2">
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
    </section>
  );
}
