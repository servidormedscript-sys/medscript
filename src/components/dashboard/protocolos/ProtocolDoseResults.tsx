import type { ProtocolResult } from "@/lib/clinical/protocols/types";

type ProtocolDoseResultsProps = {
  result: ProtocolResult | null;
  error: string | null;
  loading?: boolean;
};

export default function ProtocolDoseResults({
  result,
  error,
}: ProtocolDoseResultsProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-navy-900/15 bg-white px-4 py-8 text-center text-sm text-navy-800/55">
        Preencha peso e idade para visualizar as doses calculadas.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-navy-900/10 bg-navy-50 px-4 py-3">
        <p className="text-xs font-medium tracking-wide text-navy-700 uppercase">
          Faixa etária identificada
        </p>
        <p className="mt-1 text-sm font-medium text-navy-950">
          {result.ageGroupLabel}
        </p>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <ul className="space-y-1 text-sm text-amber-900">
            {result.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.steps.length > 0 && (
        <div className="space-y-3">
          {result.steps.map((step) => (
            <section
              key={step.title}
              className="rounded-lg border border-navy-900/10 bg-white p-5"
            >
              <h4 className="mb-3 text-sm font-medium text-navy-950">
                {step.title}
              </h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-navy-800/80">
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-navy-900/10 bg-white overflow-hidden">
        <div className="border-b border-navy-900/8 bg-navy-50 px-5 py-3">
          <h4 className="text-sm font-medium text-navy-950">
            Doses calculadas
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-navy-900/8 text-left text-xs text-navy-800/60">
                <th className="px-5 py-3 font-medium">Medicamento</th>
                <th className="px-5 py-3 font-medium">Dose</th>
                <th className="px-5 py-3 font-medium">Via</th>
                <th className="px-5 py-3 font-medium">Observações</th>
              </tr>
            </thead>
            <tbody>
              {result.doses.map((dose) => (
                <tr
                  key={`${dose.drug}-${dose.calculatedDose}`}
                  className="border-b border-navy-900/5 last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-navy-950">
                    {dose.drug}
                  </td>
                  <td className="px-5 py-3 text-navy-900">
                    {dose.calculatedDose}
                    {dose.frequency && (
                      <span className="mt-0.5 block text-xs text-navy-800/55">
                        {dose.frequency}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-navy-800/75">{dose.route}</td>
                  <td className="px-5 py-3 text-navy-800/65">
                    {dose.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {result.references && result.references.length > 0 && (
        <p className="text-xs leading-relaxed text-navy-800/50">
          {result.references.join(" ")}
        </p>
      )}
    </div>
  );
}
