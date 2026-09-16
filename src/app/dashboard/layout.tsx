import Sidebar from "@/components/dashboard/Sidebar";
import DashboardAlertsLayer from "@/components/dashboard/DashboardAlertsLayer";
import { requireSessionProfile, isAdmin } from "@/lib/auth/get-session-profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireSessionProfile();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-ocean-50/80 via-navy-50 to-white">
      <Sidebar
        isAdmin={isAdmin(profile)}
        profile={profile}
        userEmail={user.email}
      />
      <main className="relative ml-64 min-h-dvh flex-1 overflow-auto">{children}</main>
      <DashboardAlertsLayer />
    </div>
  );
}
