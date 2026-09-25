import Sidebar from "@/components/dashboard/Sidebar";
import DashboardAlertsLayer from "@/components/dashboard/DashboardAlertsLayer";
import DashboardSupportTopBar from "@/components/dashboard/DashboardSupportTopBar";
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
    <div className="flex min-h-screen bg-gradient-to-br from-ocean-50/80 via-navy-50 to-white">
      <Sidebar
        isAdmin={isAdmin(profile)}
        isSuperAdmin={isSuperAdmin(profile)}
        paymentsEnabled={isPaymentsEnabled()}
        profile={profile}
        userEmail={user.email}
      />
      <main className="relative ml-64 min-h-dvh flex-1 overflow-auto">
        {impersonateLabel ? (
          <ImpersonationBanner adminLabel={impersonateLabel} />
        ) : (
          <SubscriptionWarningBanner />
        )}
        <DashboardSupportTopBar />
        {children}
      </main>
      <DashboardAlertsLayer />
    </div>
  );
}
