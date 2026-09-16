import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  calculateShiftHours,
  getMonthDateRange,
  parseMonthYear,
} from "@/lib/agenda/shift-hours";
import type {
  ShiftRankingResponse,
  ShiftSummaryItem,
  TeamShiftRanking,
  UserShiftRanking,
} from "@/lib/agenda/ranking-types";
import { createAdminClient } from "@/lib/supabase/admin";

const SHIFT_SELECT = `
  id,
  member_id,
  shift_date,
  start_time,
  end_time,
  notes,
  member:profiles!shift_schedules_member_id_fkey (
    id,
    full_name,
    email
  )
`;

export async function GET(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { searchParams } = new URL(request.url);
  const parsed = parseMonthYear(
    searchParams.get("month"),
    searchParams.get("year"),
  );

  if (!parsed) {
    return NextResponse.json(
      { error: "Mês ou ano inválido." },
      { status: 400 },
    );
  }

  const { month, year } = parsed;
  const { startDate, endDate } = getMonthDateRange(month, year);
  const adminClient = createAdminClient();

  const { data: shifts, error: shiftsError } = await adminClient
    .from("shift_schedules")
    .select(SHIFT_SELECT)
    .eq("admin_id", session.adminId)
    .gte("shift_date", startDate)
    .lte("shift_date", endDate)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 });
  }

  const allShifts = shifts ?? [];
  const userId = session.user!.id;
  const displayName =
    session.profile.full_name ?? session.user!.email ?? "Usuário";

  const myShifts: ShiftSummaryItem[] = allShifts
    .filter((shift) => shift.member_id === userId)
    .map((shift) => ({
      id: shift.id,
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      notes: shift.notes ?? "",
      hours: calculateShiftHours(shift.start_time, shift.end_time),
    }));

  const myTotals = myShifts.reduce(
    (acc, shift) => ({
      shifts: acc.shifts + 1,
      hours: acc.hours + shift.hours,
    }),
    { shifts: 0, hours: 0 },
  );

  const userTotals = new Map<
    string,
    { full_name: string; shifts: number; hours: number }
  >();

  for (const shift of allShifts) {
    const hours = calculateShiftHours(shift.start_time, shift.end_time);
    const member = shift.member as
      | { id: string; full_name: string | null; email: string }
      | null;
    const memberId = shift.member_id;
    const fullName =
      member?.full_name ?? member?.email ?? "Usuário sem nome";

    const current = userTotals.get(memberId) ?? {
      full_name: fullName,
      shifts: 0,
      hours: 0,
    };

    current.shifts += 1;
    current.hours += hours;
    userTotals.set(memberId, current);
  }

  const userRankings: UserShiftRanking[] = [...userTotals.entries()]
    .map(([user_id, stats]) => ({
      user_id,
      full_name: stats.full_name,
      shifts: stats.shifts,
      hours: Number(stats.hours.toFixed(2)),
    }))
    .sort((a, b) => b.hours - a.hours || b.shifts - a.shifts)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const { data: teams, error: teamsError } = await adminClient
    .from("organizations")
    .select(
      `
      id,
      name,
      organization_members (
        profile_id
      )
    `,
    )
    .eq("admin_id", session.adminId);

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const teamRankings: TeamShiftRanking[] = (teams ?? [])
    .map((team) => {
      const memberIds = new Set(
        (team.organization_members ?? []).map(
          (member: { profile_id: string }) => member.profile_id,
        ),
      );

      let teamShifts = 0;
      let teamHours = 0;

      for (const shift of allShifts) {
        if (!memberIds.has(shift.member_id)) continue;
        teamShifts += 1;
        teamHours += calculateShiftHours(shift.start_time, shift.end_time);
      }

      return {
        team_id: team.id,
        team_name: team.name,
        shifts: teamShifts,
        hours: Number(teamHours.toFixed(2)),
        member_count: memberIds.size,
      };
    })
    .filter((team) => team.shifts > 0 || team.member_count > 0)
    .sort((a, b) => b.hours - a.hours || b.shifts - a.shifts)
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

  const response: ShiftRankingResponse = {
    month,
    year,
    user_name: displayName,
    my_shifts: myShifts.map((shift) => ({
      ...shift,
      hours: Number(shift.hours.toFixed(2)),
    })),
    my_totals: {
      shifts: myTotals.shifts,
      hours: Number(myTotals.hours.toFixed(2)),
    },
    team_rankings: teamRankings,
    user_rankings: userRankings,
  };

  return NextResponse.json(response);
}
