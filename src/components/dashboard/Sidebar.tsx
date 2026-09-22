"use client";

import BrandLogo from "@/components/BrandLogo";
import SidebarNavIcon from "@/components/dashboard/SidebarNavIcon";
import type { Profile, UserType } from "@/lib/types/profile";
import { getProfileAvatarUrl } from "@/lib/profile/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNav } from "@/lib/dashboard/nav";

type SidebarProps = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  profile: Profile | null;
  userEmail?: string | null;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleLabel(
  isSuperAdmin: boolean,
  isAdmin: boolean,
  userType: UserType | null | undefined,
) {
  if (isSuperAdmin) return "Admin do sistema";
  if (isAdmin) return "Administrador da clínica";
  if (userType === "plantonista") return "Plantonista";
  if (userType === "estudante") return "Estudante";
  return "Sub-usuário";
}

export default function Sidebar({
  isAdmin,
  isSuperAdmin,
  profile,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();

  const mainNav = dashboardNav.filter(
    (item) =>
      !item.superAdminOnly && (!item.adminOnly || isAdmin),
  );
  const platformNav = dashboardNav.filter(
    (item) => item.superAdminOnly && isSuperAdmin,
  );

  const displayName = profile?.full_name ?? userEmail ?? "Usuário";
  const roleLabel = getRoleLabel(isSuperAdmin, isAdmin, profile?.user_type);
  const initials = getInitials(displayName) || "U";
  const avatarUrl = getProfileAvatarUrl(profile?.avatar_url);
  const isProfilePage = pathname === "/dashboard/perfil";

  function renderNavItem(item: (typeof dashboardNav)[number], index: number) {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    return (
      <li
        key={item.href}
        className="sidebar-nav-item"
        style={{ animationDelay: `${index * 55}ms` }}
      >
        <Link
          href={item.href}
          className={`sidebar-nav-link group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
            isActive
              ? "bg-white/10 font-medium text-white shadow-lg shadow-black/15"
              : "text-white/70 hover:translate-x-1 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {isActive ? (
            <span
              className="sidebar-active-indicator absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-med-red"
              aria-hidden="true"
            />
          ) : null}
          <SidebarNavIcon href={item.href} active={isActive} />
          <span className="relative z-[1]">{item.label}</span>
          {!isActive ? (
            <span
              className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 transition-all duration-500 group-hover:left-full group-hover:opacity-100"
              aria-hidden="true"
            />
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-dvh max-h-dvh w-64 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-navy-950 via-navy-900 to-ocean-950 text-white shadow-xl shadow-navy-950/30">
      <div className="sidebar-bg-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="sidebar-bg-grid pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
      <div className="relative shrink-0 border-b border-white/10 px-3 py-5">
        <Link
          href="/dashboard"
          className="sidebar-logo-link group mx-auto block w-full"
        >
          <div className="mx-auto flex h-[4.75rem] w-full max-w-[13rem] items-center justify-center">
            <BrandLogo
              size="sidebar"
              variant="white"
              glow
              priority
              className="h-[4rem] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      </div>

      <div className="sidebar-nav-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 pb-2 pt-3">
        <nav className="relative">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Menu
          </p>
          <ul className="space-y-1">
            {mainNav.map((item, index) => renderNavItem(item, index))}
          </ul>
        </nav>

        {platformNav.length > 0 ? (
          <nav className="relative mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Plataforma
            </p>
            <ul className="space-y-1">
              {platformNav.map((item, index) => renderNavItem(item, index + mainNav.length))}
            </ul>
          </nav>
        ) : null}
      </div>

      <div className="relative shrink-0 border-t border-white/10 px-3 py-3">
        <div
          className={`rounded-xl border bg-white/[0.04] p-3 transition-colors ${
            isProfilePage
              ? "border-white/20 bg-white/[0.08]"
              : "border-white/10"
          }`}
        >
          <Link
            href="/dashboard/perfil"
            className="sidebar-footer-link group flex items-center gap-3 rounded-lg p-1 transition-all duration-300 hover:bg-white/[0.06]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-600/50 text-sm font-semibold text-white ring-2 ring-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="text-[11px] text-white/45">{roleLabel}</p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/60"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m9 6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <form action="/auth/signout" method="post" className="mt-3">
            <button
              type="submit"
              className="dashboard-btn-ghost w-full rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-white hover:shadow-lg hover:shadow-black/20"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
      </div>
    </aside>
  );
}
