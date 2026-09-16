import type { Profile } from "@/lib/types/profile";

export function getOrganizationAdminId(profile: Profile): string {
  if (profile.role === "admin") {
    return profile.id;
  }

  if (profile.parent_admin_id) {
    return profile.parent_admin_id;
  }

  return profile.id;
}
