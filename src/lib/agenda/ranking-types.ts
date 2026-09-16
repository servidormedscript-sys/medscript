export type ShiftSummaryItem = {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  hours: number;
};

export type ShiftRankingTotals = {
  shifts: number;
  hours: number;
};

export type TeamShiftRanking = {
  team_id: string;
  team_name: string;
  shifts: number;
  hours: number;
  member_count: number;
  rank: number;
};

export type UserShiftRanking = {
  user_id: string;
  full_name: string;
  shifts: number;
  hours: number;
  rank: number;
};

export type ShiftRankingResponse = {
  month: number;
  year: number;
  user_name: string;
  my_shifts: ShiftSummaryItem[];
  my_totals: ShiftRankingTotals;
  team_rankings: TeamShiftRanking[];
  user_rankings: UserShiftRanking[];
};
