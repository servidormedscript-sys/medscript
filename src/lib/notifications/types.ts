export type UserNotification = {
  id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};
