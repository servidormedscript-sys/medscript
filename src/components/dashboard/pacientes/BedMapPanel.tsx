"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BedMapPayload } from "@/lib/inpatient/bed-map-data";
import { INPATIENT_SPECIALTY_OPTIONS } from "@/lib/inpatient/specialty";
import { inpatientChartUrl } from "@/lib/dashboard/inpatient-chart-url";
import InpatientSpecialtyChart from "@/components/inpatient/InpatientSpecialtyChart";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import {
  BED_STATUS_LABELS,
  type OrganizationBedStatus,
} from "@/lib/types/organization-bed";
import type { RiskLevel } from "@/lib/types/patient";

const RISK_BORDER: Record<RiskLevel, string> = {
  alto: "border-red-400 ring-1 ring-red-200",
  medio: "border-amber-400 ring-1 ring-amber-200",
  baixo: "border-emerald-400 ring-1 ring-emerald-200",
};

type Props = {
  onInternarAqui: (bed: { id: string; code: string; unit: string }) => void;
};

export default function BedMapPanel({ onInternarAqui }: Props) {
  const [data, setData] = useState<BedMapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrganizationBedStatus | "">("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "">("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pacientes/mapa-leitos");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar mapa.");
        setData(null);
        return;
      }
      setData(json as BedMapPayload);
    } catch {
      setError("Erro ao carregar mapa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useClinicRealtime(load);

  const units = useMemo(() => {
    const set = new Set<string>();
    for (const b of data?.beds ?? []) {
      set.add(b.unit || "Sem setor");
    }
    return [...set].sort();
  }, [data?.beds]);

  const filteredBeds = useMemo(() => {
    return (data?.beds ?? []).filter((bed) => {
      if (unitFilter && (bed.unit || "Sem setor") !== unitFilter) return false;
      if (statusFilter && bed.status !== statusFilter) return false;
      if (riskFilter && bed.episode?.risk !== riskFilter) return false;
      return true;
    });
  }, [data?.beds, unitFilter, statusFilter, riskFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, BedMapPayload["beds"]>();
    for (const bed of filteredBeds) {
      const key = bed.unit || "Sem setor";
      const list = map.get(key) ?? [];
      list.push(bed);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBeds]);

  async function releaseBed(bedId: string, toStatus: OrganizationBedStatus) {
    const res = await fetch(`/api/organizacao/leitos/${bedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Não foi possível atualizar o leito.");
      return;
    }
    load();
  }

  if (loading && !data) {
    return <p className="text-sm text-navy-800/60">Carregando mapa de leitos...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-navy-900/10 bg-white px-3 py-1">
              {data.summary.total} leitos
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
              {data.summary.livre} livres
            </span>
            <span className="rounded-full border border-navy-200 bg-navy-50 px-3 py-1">
              {data.summary.ocupado} ocupados
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {data.summary.higienizacao} em higienização
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-navy-900/8 bg-white p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-navy-950">
                Internados por especialidade
              </h3>
              <div className="mt-3">
                <InpatientSpecialtyChart
                  rows={data.specialty_chart}
                  highlightSpecialty={specialtyFilter || null}
                />
              </div>
            </div>

            <div className="rounded-lg border border-navy-900/8 bg-white p-4">
              <h3 className="text-sm font-medium text-navy-950">Filtros</h3>
              <div className="mt-3 space-y-3 text-sm">
                <label className="block">
                  <span className="text-xs text-navy-800/60">Setor</span>
                  <select
                    className="mt-1 w-full rounded-md border border-navy-900/12 px-2 py-1.5"
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-navy-800/60">Status do leito</span>
                  <select
                    className="mt-1 w-full rounded-md border border-navy-900/12 px-2 py-1.5"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as OrganizationBedStatus | "")
                    }
                  >
                    <option value="">Todos</option>
                    {(Object.keys(BED_STATUS_LABELS) as OrganizationBedStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>{BED_STATUS_LABELS[s]}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-navy-800/60">Risco (ocupados)</span>
                  <select
                    className="mt-1 w-full rounded-md border border-navy-900/12 px-2 py-1.5"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "")}
                  >
                    <option value="">Todos</option>
                    <option value="alto">Alto</option>
                    <option value="medio">Médio</option>
                    <option value="baixo">Baixo</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-navy-800/60">Destaque especialidade</span>
                  <select
                    className="mt-1 w-full rounded-md border border-navy-900/12 px-2 py-1.5"
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                  >
                    <option value="">Nenhum</option>
                    {INPATIENT_SPECIALTY_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {data.beds.length === 0 ? (
            <p className="text-sm text-navy-800/65">
              Nenhum leito cadastrado.{" "}
              <Link
                href="/dashboard/organizacao-clinica"
                className="font-medium text-navy-900 underline"
              >
                Cadastre leitos em Organização Clínica
              </Link>
              .
            </p>
          ) : (
            grouped.map(([unit, beds]) => {
              const occupied = beds.filter((b) => b.status === "ocupado").length;
              return (
                <section key={unit}>
                  <h3 className="mb-3 text-sm font-semibold text-navy-950">
                    {unit}{" "}
                    <span className="font-normal text-navy-800/55">
                      ({occupied}/{beds.length} ocupados)
                    </span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {beds.map((bed) => (
                      <BedCard
                        key={bed.id}
                        bed={bed}
                        onInternar={() =>
                          onInternarAqui({
                            id: bed.id,
                            code: bed.code,
                            unit: bed.unit,
                          })
                        }
                        onRelease={(status) => releaseBed(bed.id, status)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

function BedCard({
  bed,
  onInternar,
  onRelease,
}: {
  bed: BedMapPayload["beds"][number];
  onInternar: () => void;
  onRelease: (status: OrganizationBedStatus) => void;
}) {
  const muted =
    bed.status === "higienizacao" || bed.status === "bloqueado";

  return (
    <article
      className={`flex flex-col rounded-md border bg-white p-3 text-sm ${
        muted ? "border-dashed border-slate-300 bg-slate-50/80" : "border-navy-900/10"
      } ${
        bed.episode?.risk ? RISK_BORDER[bed.episode.risk] : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-navy-950">Leito {bed.code}</p>
        <span className="text-[10px] font-medium uppercase text-navy-800/50">
          {BED_STATUS_LABELS[bed.status]}
        </span>
      </div>

      {bed.episode ? (
        <>
          <p className="mt-2 font-medium text-navy-900">{bed.episode.patient_name}</p>
          {bed.episode.diagnosis && (
            <p className="mt-1 line-clamp-2 text-xs text-navy-800/65">
              {bed.episode.diagnosis}
            </p>
          )}
          <Link
            href={inpatientChartUrl(bed.episode.id)}
            className="mt-3 text-xs font-medium text-navy-900 underline"
          >
            Abrir prontuário
          </Link>
        </>
      ) : bed.status === "livre" ? (
        <button
          type="button"
          onClick={onInternar}
          className="mt-3 rounded border border-navy-900/15 bg-navy-900 py-1.5 text-xs font-medium text-white hover:bg-navy-800"
        >
          Internar aqui
        </button>
      ) : (
        <p className="mt-2 text-xs text-navy-800/55">Sem paciente</p>
      )}

      {(bed.status === "higienizacao" || bed.status === "bloqueado") && (
        <button
          type="button"
          onClick={() => onRelease("livre")}
          className="mt-3 rounded border border-navy-900/12 py-1 text-xs font-medium text-navy-800 hover:bg-white"
        >
          Marcar como livre
        </button>
      )}
    </article>
  );
}
