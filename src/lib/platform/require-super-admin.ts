import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/platform/super-admin";
import type { Profile } from "@/lib/types/profile";

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !isSuperAdmin(profile as Profile)) {
    return {
      error: NextResponse.json({ error: "Acesso restrito ao admin do site." }, { status: 403 }),
    };
  }

  return { user, profile: profile as Profile, admin };
}
