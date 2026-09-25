import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import type { Profile } from "@/lib/types/profile";

export type SubscriptionRow = {
  user_id: string;
  status: string;
  access_ends_at: string | null;
  trial_ends_at: string | null;
  paid_days_total: number;
  complimentary_access: boolean;
  complimentary_note: string | null;
  mp_preapproval_id: string | null;
  recurring_plan_code: string | null;
  mp_subscription_status: string | null;
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
  if (!isPaymentsEnabled()) {
    return profile.account_status === "active";
  }
  if (profile.platform_role === "super_admin") return true;
  if (profile.account_status !== "active") return false;
  if (subscription?.complimentary_access) return true;

  const endsAt = getAccessEndsAt(subscription);
  if (!endsAt) return profile.role === "member";

  return new Date(endsAt).getTime() > Date.now();
}

/** Avaliação gratuita de 14 dias — ainda sem pagamento confirmado. */
export function isInFreeTrialPeriod(subscription: SubscriptionRow | null) {
  if (!subscription || subscription.complimentary_access) return false;
  if ((subscription.paid_days_total ?? 0) > 0) return false;
  if (subscription.mp_subscription_status === "authorized") return false;
  const trialEnd = subscription.trial_ends_at;
  if (!trialEnd) return false;
  return new Date(trialEnd).getTime() > Date.now();
}

export function canPurchasePlan(subscription: SubscriptionRow | null) {
  if (!isPaymentsEnabled()) return false;
  if (!subscription || subscription.complimentary_access) return false;
  return !isInFreeTrialPeriod(subscription);
}

export function shouldShowRenewalWarning(subscription: SubscriptionRow | null) {
  if (!isPaymentsEnabled()) return false;
  if (!subscription || subscription.complimentary_access) return false;
  const endsAt = getAccessEndsAt(subscription);
  const days = getDaysRemaining(endsAt);
  if (days === null) return false;
  if (isInFreeTrialPeriod(subscription)) {
    return days <= 2;
  }
  return days <= 2;
}

export function formatAccessWarning(
  days: number,
  subscription?: SubscriptionRow | null
) {
  const inTrial = subscription && isInFreeTrialPeriod(subscription);
  if (inTrial) {
    if (days <= 0) {
      return "Sua avaliação gratuita encerrou. Contrate um plano para continuar usando o MEDScript.";
    }
    if (days === 1) {
      return "Sua avaliação gratuita termina amanhã. Depois disso será necessário contratar um plano.";
    }
    return `Sua avaliação gratuita termina em ${days} dias.`;
  }
  if (days <= 0) {
    return "Seu plano encerrou. Renove para continuar usando o MEDScript.";
  }
  if (days === 1) {
    return "Seu plano encerra amanhã. Renove para não perder o acesso.";
  }
  return `Seu plano encerra em ${days} dias. Renove agora — os dias pagos são somados ao saldo restante.`;
}
