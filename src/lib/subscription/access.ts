import type { Profile } from "@/lib/types/profile";

export type SubscriptionRow = {
  user_id: string;
  status: string;
  access_ends_at: string | null;
  trial_ends_at: string | null;
  paid_days_total: number;
  complimentary_access: boolean;
  complimentary_note: string | null;
};

export function getAccessEndsAt(subscription: SubscriptionRow | null) {
  if (!subscription) return null;
  if (subscription.complimentary_access) return null;
  return subscription.access_ends_at ?? subscription.trial_ends_at;
}

export function getDaysRemaining(accessEndsAt: string | null) {
  if (!accessEndsAt) return null;
  const diffMs = new Date(accessEndsAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function hasPlatformAccess(
  profile: Profile,
  subscription: SubscriptionRow | null
) {
  if (profile.platform_role === "super_admin") return true;
  if (profile.account_status !== "active") return false;
  if (subscription?.complimentary_access) return true;

  const endsAt = getAccessEndsAt(subscription);
  if (!endsAt) return profile.role === "member";

  return new Date(endsAt).getTime() > Date.now();
}

export function shouldShowRenewalWarning(subscription: SubscriptionRow | null) {
  if (!subscription || subscription.complimentary_access) return false;
  const days = getDaysRemaining(getAccessEndsAt(subscription));
  if (days === null) return false;
  return days <= 2;
}

export function formatAccessWarning(days: number) {
  if (days <= 0) {
    return "Seu plano encerrou. Renove para continuar usando o MEDScript.";
  }
  if (days === 1) {
    return "Seu plano encerra amanhã. Renove para não perder o acesso.";
  }
  return `Seu plano encerra em ${days} dias. Renove agora — os dias pagos são somados ao saldo restante.`;
}
