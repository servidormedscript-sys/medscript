import type { ClinicalProtocol } from "@/lib/clinical/protocols/types";

type ProtocolListProps = {
  title: string;
  description?: string;
  protocols: ClinicalProtocol[];
  onSelect: (protocol: ClinicalProtocol) => void;
};

export default function ProtocolList({
  title,
  description,
  protocols,
  onSelect,
}: ProtocolListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-navy-950">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-navy-800/65">{description}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {protocols.map((protocol) => (
          <button
            key={protocol.id}
            type="button"
            onClick={() => onSelect(protocol)}
            className="rounded-lg border border-navy-900/10 bg-white p-4 text-left transition-colors hover:border-navy-900/20 hover:bg-navy-50/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-navy-950">
                  {protocol.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-navy-800/65">
                  {protocol.summary}
                </p>
              </div>
              {protocol.hasDoseCalculator && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Doses
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
