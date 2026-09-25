"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardSupportTopBar from "@/components/dashboard/DashboardSupportTopBar";
import Sidebar from "@/components/dashboard/Sidebar";
import type { Profile } from "@/lib/types/profile";

type DashboardLayoutShellProps = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  paymentsEnabled: boolean;
  profile: Profile | null;
  userEmail?: string | null;
  banners: React.ReactNode;
  children: React.ReactNode;
};

export default function DashboardLayoutShell({
  isAdmin,
  isSuperAdmin,
  paymentsEnabled,
  profile,
  userEmail,
  banners,
  children,
}: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-ocean-50/80 via-navy-50 to-white">
      {navOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <Sidebar
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        paymentsEnabled={paymentsEnabled}
        profile={profile}
        userEmail={userEmail}
        mobileOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col lg:ml-[calc(18rem+1rem)]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-900/8 bg-white/95 px-4 py-2.5 backdrop-blur-sm pt-[max(0.625rem,env(safe-area-inset-top))] lg:hidden">
          <button
            type="button"
            aria-expanded={navOpen}
            aria-label="Abrir menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-navy-900/12 text-navy-950"
            onClick={() => setNavOpen(true)}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="flex-1 truncate text-sm font-semibold text-navy-950">
            MEDScript
          </span>
          <div className="shrink-0">
            <DashboardSupportTopBar variant="embedded" />
          </div>
        </header>

        <main className="relative flex-1 overflow-auto pb-[env(safe-area-inset-bottom)]">
          {banners}
          <div className="hidden lg:block">
            <DashboardSupportTopBar />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
