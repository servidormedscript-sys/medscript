import BillingPanel, { type BillingHistoryItem } from "@/components/billing/BillingPanel";
import BrandLogo from "@/components/BrandLogo";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { assertAccountCanLogin, loadSubscriptionForProfile } from "@/lib/platform/account-access";
import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { syncPendingPaymentsForUser } from "@/lib/payments/sync-pending-payments";
import {
  canPurchasePlan,
  getAccessEndsAt,
  getDaysRemaining,
  hasPlatformAccess,
  isInFreeTrialPeriod,
} from "@/lib/subscription/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode } from "@/lib/subscription/plans";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plano — MEDScript",
  robots: { index: false, follow: false },
};

export default async function AssinaturaPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  if (!isPaymentsEnabled()) {
    redirect("/dashboard");
  }

  const access = await assertAccountCanLogin(profile);
  if (!access.ok && access.reason !== "expired") {
    redirect("/login?error=acesso");
  }

  const subscription = await loadSubscriptionForProfile(profile);

  if (profile.role === "admin" && profile.platform_role !== "super_admin") {
    try {
      await syncPendingPaymentsForUser(profile.id);
    } catch (error) {
      console.error("[assinatura] sync pending", error);
    }
  }

  const hasAccess = access.ok && hasPlatformAccess(profile, subscription);
  const inFreeTrial = isInFreeTrialPeriod(subscription);
  const canPurchase = canPurchasePlan(subscription);
  const accessEndsAt = getAccessEndsAt(subscription);
  const daysRemaining = getDaysRemaining(accessEndsAt);

  let payments: BillingHistoryItem[] = [];
  if (profile.role === "admin" && profile.platform_role !== "super_admin") {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("billing_payments")
      .select("id, plan_code, amount_cents, days, status, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("[assinatura] histórico", error);
    }

    payments = (data ?? []).map((row) => ({
      id: row.id as string,
      planCode: row.plan_code as PlanCode,
      amountCents: row.amount_cents as number,
      days: row.days as number,
      status: row.status as string,
      createdAt: row.created_at as string,
    }));
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-ocean-50/80 via-navy-50 to-white">
      <header className="border-b border-ocean-100 bg-white/90">
        <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between px-6">
          <Link href={hasAccess ? "/dashboard" : "/"}>
            <BrandLogo size="header" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {hasAccess ? (
              <Link href="/dashboard" className="font-medium text-ocean-800 hover:text-ocean-700">
                Ir para o painel
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-navy-800/60 hover:text-navy-900">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        {profile.platform_role === "super_admin" ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-ocean-100 bg-white p-8 text-sm text-navy-800/70">
            A conta de administrador da plataforma não possui cobrança.
          </div>
        ) : profile.role !== "admin" ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-ocean-100 bg-white p-8 text-sm leading-relaxed text-navy-800/70">
            Somente o administrador da clínica pode pagar o plano. Se o acesso encerrou,
            peça a renovação para quem criou a conta da clínica.
          </div>
        ) : (
          <BillingPanel
            clinicName={profile.clinic_name}
            accessEndsAt={accessEndsAt}
            daysRemaining={daysRemaining}
            complimentary={subscription?.complimentary_access ?? false}
            hasAccess={hasAccess}
            inFreeTrial={inFreeTrial}
            canPurchase={canPurchase}
            trialEndsAt={subscription?.trial_ends_at ?? null}
            recurringPlanCode={
              subscription?.recurring_plan_code === "monthly" ||
              subscription?.recurring_plan_code === "annual"
                ? subscription.recurring_plan_code
                : null
            }
            mpSubscriptionStatus={subscription?.mp_subscription_status ?? null}
            payments={payments}
          />
        )}
      </main>
    </div>
  );
}
