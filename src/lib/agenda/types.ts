export type ShiftSchedule = {
  id: string;
  admin_id: string;
  member_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    full_name: string | null;
    email: string;
    user_type: string | null;
  } | null;
};
