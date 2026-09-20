import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types/profile";
import { assertAccountCanLogin } from "@/lib/platform/account-access";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

export async function requireSessionProfile() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile) {
    const access = await assertAccountCanLogin(profile);
    if (!access.ok) {
      redirect("/login?error=acesso");
    }
  }

  return { user, profile };
}

export async function requireAdminProfile() {
  const { user, profile } = await requireSessionProfile();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, profile: profile as Profile };
}

export function isAdmin(profile: Profile | null) {
  return profile?.role === "admin";
}
