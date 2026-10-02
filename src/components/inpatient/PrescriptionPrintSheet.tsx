"use client";

import { GENERAL_ORDER_ITEMS } from "@/lib/inpatient/general-orders";
import { formatPrescriptionLine } from "@/lib/inpatient/prescription-format";
import type {
  EpisodeGeneralOrders,
  EpisodePrescription,
} from "@/lib/types/inpatient-chart";
import type { PatientEpisode } from "@/lib/types/patient";

type Props = {
  patientName: string;
  episode: PatientEpisode;
  generalOrders: EpisodeGeneralOrders;
  activePrescriptions: EpisodePrescription[];
  hours: string[];
};

export default function PrescriptionPrintSheet({
  patientName,
  episode,
  generalOrders,
  activePrescriptions,
  hours,
}: Props) {
  function print() {
    window.print();
  }

  const enabledOrders = GENERAL_ORDER_ITEMS.filter(
    (o) => generalOrders.order_flags[o.id],
  );

  return (
    <section className="rounded-lg border border-navy-900/8 bg-white p-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <h3 className="text-sm font-semibold text-navy-950">
          Modelo de prescrição (plantão)
        </h3>
        <button
          type="button"
          onClick={print}
          className="rounded-md border border-navy-900/12 px-3 py-1.5 text-sm font-medium"
        >
          Imprimir / PDF
        </button>
      </div>

      <div
        id="prescription-print-area"
        className="mt-4 text-xs text-navy-950 print:mt-0"
      >
        <p className="font-semibold">MEDScript — Prescrição</p>
        <p>{patientName} · Leito {episode.bed ?? "—"}</p>
        <p className="mt-2 font-medium">Ordens gerais</p>
        {enabledOrders.length === 0 ? (
          <p className="text-navy-800/60">—</p>
        ) : (
          <ul className="list-disc pl-4">
            {enabledOrders.map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
          </ul>
        )}
        <table className="mt-4 w-full border-collapse border border-navy-900/20">
          <thead>
            <tr>
              <th className="border border-navy-900/20 p-1 text-left">#</th>
              {hours.map((h) => (
                <th key={h} className="border border-navy-900/20 p-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activePrescriptions.map((rx, i) => (
              <tr key={rx.id}>
                <td className="border border-navy-900/20 p-1">
                  {i + 1}. {formatPrescriptionLine(rx)}
                </td>
                {hours.map((h) => (
                  <td key={h} className="border border-navy-900/20 p-1" />
                ))}
              </tr>
            ))}
            {[1, 2, 3, 4].map((n) => (
              <tr key={`blank-${n}`}>
                <td className="border border-navy-900/20 p-1 text-navy-800/40">
                  Uso contínuo avulso —
                </td>
                {hours.map((h) => (
                  <td key={h} className="border border-navy-900/20 p-1" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
