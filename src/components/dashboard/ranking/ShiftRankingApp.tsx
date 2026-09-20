"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatShiftDate, formatShiftTime } from "@/lib/agenda/format";
import { downloadShiftSummaryPdf } from "@/lib/agenda/export-shift-summary-pdf";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import {
  formatShiftHours,
  getMonthLabel,
  MONTH_LABELS,
} from "@/lib/agenda/shift-hours";
import type { ShiftRankingResponse } from "@/lib/agenda/ranking-types";

function buildYearOptions(currentYear: number) {
  return Array.from({ length: 6 }, (_, index) => currentYear - index);
}

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-amber-100 text-amber-900 ring-amber-200"
      : rank === 2
        ? "bg-slate-100 text-slate-700 ring-slate-200"
        : rank === 3
          ? "bg-orange-100 text-orange-900 ring-orange-200"
          : "bg-ocean-50 text-ocean-800 ring-ocean-100";

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ${tone}`}
    >
      {rank}
    </span>
  );
}

export default function ShiftRankingApp() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<ShiftRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const yearOptions = useMemo(() => buildYearOptions(today.getFullYear()), [today]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`/api/ranking-resumo?${params}`);
      const payload = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: payload.error ?? "Erro ao carregar ranking e resumo.",
        });
        setData(null);
        return;
      }

      setData(payload as ShiftRankingResponse);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar ranking e resumo." });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useClinicRealtime(loadData);

  async function handleExportPdf() {
    if (!data) return;

    setExporting(true);
    setMessage(null);

    try {
      await downloadShiftSummaryPdf(data);
      setMessage({ type: "success", text: "PDF exportado com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Erro ao exportar PDF." });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-950">Meu resumo</h2>
            <p className="mt-1 text-sm text-navy-800/60">
              Consulte seus plantões por mês e exporte o relatório em PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Mês
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded-xl border border-ocean-100 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-ocean-500"
              >
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-xl border border-ocean-100 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-ocean-500"
              >
                {yearOptions.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading || !data}
              className="rounded-lg bg-ocean-800 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        {message ? (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ocean-100 bg-ocean-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean-700/70">
              Plantões no mês
            </p>
            <p className="mt-2 text-3xl font-semibold text-navy-950">
              {loading ? "..." : (data?.my_totals.shifts ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-ocean-100 bg-ocean-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean-700/70">
              Horas realizadas
            </p>
            <p className="mt-2 text-3xl font-semibold text-navy-950">
              {loading
                ? "..."
                : formatShiftHours(data?.my_totals.hours ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-navy-900/8">
          <table className="min-w-full divide-y divide-navy-900/8">
            <thead className="bg-navy-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                  Horário
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                  Duração
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/8 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                    Carregando plantões...
                  </td>
                </tr>
              ) : !data?.my_shifts.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                    Nenhum plantão registrado em {getMonthLabel(month)} de {year}.
                  </td>
                </tr>
              ) : (
                data.my_shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-ocean-50/40">
                    <td className="px-4 py-3 text-sm text-navy-950">
                      {formatShiftDate(shift.shift_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-800">
                      {formatShiftTime(shift.start_time)} –{" "}
                      {formatShiftTime(shift.end_time)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-ocean-800">
                      {formatShiftHours(shift.hours)}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-800/70">
                      {shift.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy-950">
            Ranking de equipes
          </h2>
          <p className="mt-1 text-sm text-navy-800/60">
            Equipes com maior carga horária de plantões no período.
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-navy-900/8">
            <table className="min-w-full divide-y divide-navy-900/8">
              <thead className="bg-navy-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Equipe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Plantões
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/8 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                      Carregando ranking...
                    </td>
                  </tr>
                ) : !data?.team_rankings.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                      Nenhuma equipe com plantões neste período.
                    </td>
                  </tr>
                ) : (
                  data.team_rankings.map((team) => (
                    <tr key={team.team_id} className="hover:bg-ocean-50/40">
                      <td className="px-4 py-3">
                        <RankBadge rank={team.rank} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-navy-950">
                          {team.team_name}
                        </p>
                        <p className="text-xs text-navy-800/50">
                          {team.member_count} membro
                          {team.member_count === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-800">
                        {team.shifts}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ocean-800">
                        {formatShiftHours(team.hours)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy-950">
            Ranking de usuários
          </h2>
          <p className="mt-1 text-sm text-navy-800/60">
            Profissionais com mais horas de plantão realizadas no período.
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-navy-900/8">
            <table className="min-w-full divide-y divide-navy-900/8">
              <thead className="bg-navy-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Plantões
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-navy-800/60">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/8 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                      Carregando ranking...
                    </td>
                  </tr>
                ) : !data?.user_rankings.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-sm text-navy-800/60">
                      Nenhum usuário com plantões neste período.
                    </td>
                  </tr>
                ) : (
                  data.user_rankings.map((user) => (
                    <tr key={user.user_id} className="hover:bg-ocean-50/40">
                      <td className="px-4 py-3">
                        <RankBadge rank={user.rank} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-navy-950">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-800">
                        {user.shifts}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ocean-800">
                        {formatShiftHours(user.hours)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
