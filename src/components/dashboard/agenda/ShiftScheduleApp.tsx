"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, UserType } from "@/lib/types/profile";
import type { ShiftSchedule } from "@/lib/agenda/types";
import { formatShiftDate, formatShiftTime } from "@/lib/agenda/format";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const userTypeLabels: Record<UserType, string> = {
  plantonista: "Plantonista",
  estudante: "Estudante",
};

type ShiftScheduleAppProps = {
  isAdmin: boolean;
};

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ShiftScheduleApp({ isAdmin }: ShiftScheduleAppProps) {
  const { confirm, dialog } = useConfirmDialog();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())
  );
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [form, setForm] = useState({
    member_id: "",
    start_time: "07:00",
    end_time: "19:00",
    notes: "",
  });

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(viewMonth),
        year: String(viewYear),
      });
      const res = await fetch(`/api/agenda/plantoes?${params}`);
      const data = await res.json();

      if (res.ok) {
        setShifts(data.shifts ?? []);
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao carregar plantões." });
      }
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useClinicRealtime(loadShifts);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadMembers() {
      const res = await fetch("/api/organizacao/usuarios");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.users ?? []);
        if (data.users?.length) {
          setForm((current) => ({
            ...current,
            member_id: current.member_id || data.users[0].id,
          }));
        }
      }
    }

    loadMembers();
  }, [isAdmin]);

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, ShiftSchedule[]>();
    for (const shift of shifts) {
      const list = map.get(shift.shift_date) ?? [];
      list.push(shift);
      map.set(shift.shift_date, list);
    }
    return map;
  }, [shifts]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1);
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const startOffset = firstDay.getDay();
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ day: null, dateKey: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        day,
        dateKey: toDateKey(viewYear, viewMonth, day),
      });
    }

    return cells;
  }, [viewMonth, viewYear]);

  const selectedShifts = shiftsByDate.get(selectedDate) ?? [];

  function changeMonth(delta: number) {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth() + 1);
  }

  async function handleCreateShift(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/agenda/plantoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        shift_date: selectedDate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao agendar plantão." });
      return;
    }

    setShifts((current) => [...current, data.shift].sort(compareShifts));
    setForm((current) => ({ ...current, notes: "" }));
    setMessage({
      type: "success",
      text: "Plantão agendado. O sub-usuário receberá uma notificação.",
    });
  }

  async function handleDeleteShift(shiftId: string) {
    const confirmed = await confirm({
      title: "Remover plantão?",
      description:
        "O plantão será excluído da agenda. O sub-usuário não verá mais este agendamento.",
      confirmLabel: "Remover plantão",
      tone: "danger",
    });
    if (!confirmed) return;

    const res = await fetch(`/api/agenda/plantoes/${shiftId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao remover plantão." });
      return;
    }

    setShifts((current) => current.filter((shift) => shift.id !== shiftId));
    setMessage({ type: "success", text: "Plantão removido." });
  }

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <p className="text-sm text-navy-800/65">
        {isAdmin
          ? "Agende plantões por sub-usuário, data e horário. Cada agendamento gera notificação automática."
          : "Acompanhe seus plantões agendados pela administração da clínica."}
      </p>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize text-navy-950">{monthLabel}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-md border border-navy-900/12 px-3 py-1.5 text-sm hover:bg-navy-50"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-md border border-navy-900/12 px-3 py-1.5 text-sm hover:bg-navy-50"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-navy-800/60">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell.day || !cell.dateKey) {
                return <div key={`empty-${index}`} className="min-h-16" />;
              }

              const dayShifts = shiftsByDate.get(cell.dateKey) ?? [];
              const isSelected = cell.dateKey === selectedDate;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateKey!)}
                  className={`min-h-16 rounded-lg border p-2 text-left transition-colors ${
                    isSelected
                      ? "border-ocean-400 bg-ocean-50"
                      : "border-navy-900/8 bg-navy-50/20 hover:bg-navy-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-navy-950">{cell.day}</span>
                  {dayShifts.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayShifts.slice(0, 2).map((shift) => (
                        <div
                          key={shift.id}
                          className="truncate rounded bg-ocean-100 px-1 py-0.5 text-[10px] font-medium text-ocean-900"
                        >
                          {isAdmin
                            ? shift.member?.full_name?.split(" ")[0] ?? "Plantão"
                            : `${formatShiftTime(shift.start_time)}`}
                        </div>
                      ))}
                      {dayShifts.length > 2 && (
                        <div className="text-[10px] text-navy-800/50">
                          +{dayShifts.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-950">
              {formatShiftDate(selectedDate)}
            </h2>

            {loading ? (
              <p className="mt-4 text-sm text-navy-800/60">Carregando…</p>
            ) : selectedShifts.length === 0 ? (
              <p className="mt-4 text-sm text-navy-800/60">Nenhum plantão neste dia.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedShifts.map((shift) => (
                  <li
                    key={shift.id}
                    className="rounded-lg border border-navy-900/8 bg-navy-50/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {isAdmin && (
                          <p className="text-sm font-semibold text-navy-950">
                            {shift.member?.full_name ?? "Sub-usuário"}
                          </p>
                        )}
                        <p className="text-sm text-navy-800">
                          {formatShiftTime(shift.start_time)} – {formatShiftTime(shift.end_time)}
                        </p>
                        {shift.member?.user_type && (
                          <p className="mt-1 text-xs text-navy-800/50">
                            {userTypeLabels[shift.member.user_type as UserType] ??
                              shift.member.user_type}
                          </p>
                        )}
                        {shift.notes && (
                          <p className="mt-2 text-xs text-navy-800/65">{shift.notes}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdmin && (
            <form
              onSubmit={handleCreateShift}
              className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-navy-950">Agendar plantão</h3>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-navy-900">Sub-usuário</span>
                  <select
                    required
                    value={form.member_id}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, member_id: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                  >
                    {members.length === 0 ? (
                      <option value="">Cadastre sub-usuários em Organização Clínica</option>
                    ) : (
                      members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name} ({userTypeLabels[member.user_type as UserType]})
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-navy-900">Início</span>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, start_time: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-navy-900">Fim</span>
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, end_time: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-navy-900">Observações</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, notes: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={!form.member_id}
                className="mt-4 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white hover:bg-ocean-700 disabled:opacity-50"
              >
                Agendar e notificar
              </button>
            </form>
          )}
        </section>
      </div>
      {dialog}
    </div>
  );
}

function compareShifts(a: ShiftSchedule, b: ShiftSchedule) {
  if (a.shift_date !== b.shift_date) return a.shift_date.localeCompare(b.shift_date);
  return a.start_time.localeCompare(b.start_time);
}
