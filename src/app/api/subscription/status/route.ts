import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canPurchasePlan,
  formatAccessWarning,
  getAccessEndsAt,
  getDaysRemaining,
  isInFreeTrialPeriod,
  shouldShowRenewalWarning,
} from "@/lib/subscription/access";
import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { loadSubscriptionForProfile } from "@/lib/platform/account-access";
import type { Profile } from "@/lib/types/profile";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  if ((profile as Profile).platform_role === "super_admin") {
    return NextResponse.json({ isSuperAdmin: true });
  }

  const subscription = await loadSubscriptionForProfile(profile as Profile);
  const accessEndsAt = getAccessEndsAt(subscription);
  const daysRemaining = getDaysRemaining(accessEndsAt);

  return NextResponse.json({
    accessEndsAt,
    daysRemaining,
    paidDaysTotal: subscription?.paid_days_total ?? 0,
    complimentary: subscription?.complimentary_access ?? false,
    showWarning: shouldShowRenewalWarning(subscription),
    warningMessage:
      daysRemaining !== null
        ? formatAccessWarning(daysRemaining, subscription)
        : null,
    canRenew:
      (profile as Profile).role === "admin" && canPurchasePlan(subscription),
    inFreeTrial: isInFreeTrialPeriod(subscription),
    canPurchase: canPurchasePlan(subscription),
    trialEndsAt: subscription?.trial_ends_at ?? null,
    paymentsEnabled: isPaymentsEnabled(),
  });
}
