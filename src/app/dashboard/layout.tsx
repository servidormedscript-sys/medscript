import DashboardLayoutShell from "@/components/dashboard/DashboardLayoutShell";
import DashboardAlertsLayer from "@/components/dashboard/DashboardAlertsLayer";
import SubscriptionWarningBanner from "@/components/dashboard/SubscriptionWarningBanner";
import ImpersonationBanner from "@/components/platform/ImpersonationBanner";
import { requireSessionProfile, isAdmin } from "@/lib/auth/get-session-profile";
import { getImpersonatedAdminId, isSuperAdmin } from "@/lib/platform/super-admin";
import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireSessionProfile();
  const impersonateAdminId =
    isSuperAdmin(profile) ? await getImpersonatedAdminId() : null;

  let impersonateLabel: string | null = null;
  if (impersonateAdminId) {
    const admin = createAdminClient();
    const { data: target } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", impersonateAdminId)
      .single();
    impersonateLabel = target?.full_name ?? target?.email ?? impersonateAdminId;
  }

  return (
    <>
      <DashboardLayoutShell
        isAdmin={isAdmin(profile)}
        isSuperAdmin={isSuperAdmin(profile)}
        paymentsEnabled={isPaymentsEnabled()}
        profile={profile}
        userEmail={user.email}
        banners={
          impersonateLabel ? (
            <ImpersonationBanner adminLabel={impersonateLabel} />
          ) : (
            <SubscriptionWarningBanner />
          )
        }
      >
        {children}
      </DashboardLayoutShell>
      <DashboardAlertsLayer />
    </>
  );
}
