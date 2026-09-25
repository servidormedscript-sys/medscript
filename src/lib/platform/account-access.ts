import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPlatformAccess, type SubscriptionRow } from "@/lib/subscription/access";
import type { Profile } from "@/lib/types/profile";

export async function getBillingAdminId(profile: Profile) {
  if (profile.role === "admin") return profile.id;
  return profile.parent_admin_id;
}

export async function loadSubscriptionForProfile(profile: Profile) {
  const admin = createAdminClient();
  const billingAdminId = await getBillingAdminId(profile);
  if (!billingAdminId) return null;

  const { data } = await admin
    .from("subscriptions")
    .select(
      "user_id, status, access_ends_at, trial_ends_at, paid_days_total, complimentary_access, complimentary_note, mp_preapproval_id, recurring_plan_code, mp_subscription_status"
    )
    .eq("user_id", billingAdminId)
    .maybeSingle();

  return (data as SubscriptionRow | null) ?? null;
}

export async function assertAccountCanLogin(profile: Profile) {
  if (profile.platform_role === "super_admin") {
    return { ok: true as const };
  }

  if (profile.account_status === "blocked") {
    return {
      ok: false as const,
      reason: "blocked" as const,
      message: "Sua conta foi bloqueada. Entre em contato com o suporte.",
    };
  }

  if (profile.account_status === "deactivated") {
    return {
      ok: false as const,
      reason: "deactivated" as const,
      message: "Sua conta está desativada. Fale com o administrador da clínica ou suporte.",
    };
  }

  if (!isPaymentsEnabled()) {
    return { ok: true as const };
  }

  const subscription = await loadSubscriptionForProfile(profile);
  if (!hasPlatformAccess(profile, subscription)) {
    const isBillingAdmin = profile.role === "admin";
    return {
      ok: false as const,
      reason: "expired" as const,
      message: isBillingAdmin
        ? "Seu plano ou período gratuito encerrou. Renove para continuar usando o MEDScript."
        : "O plano da clínica encerrou. Peça ao administrador para renovar o acesso.",
    };
  }

  return { ok: true as const, subscription };
}
