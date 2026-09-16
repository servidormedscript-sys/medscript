import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import type { Profile } from "@/lib/types/profile";

export async function getSessionWithAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 }) };
  }

  const adminId = getOrganizationAdminId(profile as Profile);

  return {
    user,
    profile: profile as Profile,
    adminId,
    supabase,
  };
}
