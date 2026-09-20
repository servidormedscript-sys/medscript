import { cookies } from "next/headers";
import type { Profile } from "@/lib/types/profile";

export const IMPERSONATE_COOKIE = "medscript_impersonate_admin_id";

export function isSuperAdmin(profile: Pick<Profile, "platform_role"> | null) {
  return profile?.platform_role === "super_admin";
}

export async function getImpersonatedAdminId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(IMPERSONATE_COOKIE)?.value?.trim();
  return value || null;
}
