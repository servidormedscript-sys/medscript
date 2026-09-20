import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import {
  getImpersonatedAdminId,
  isSuperAdmin,
} from "@/lib/platform/super-admin";
import type { Profile } from "@/lib/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionWithAdmin =
  | {
      error: NextResponse;
      user?: undefined;
      profile?: undefined;
      adminId?: undefined;
      supabase?: undefined;
      isSuperAdmin?: undefined;
      isImpersonating?: undefined;
    }
  | {
      error?: undefined;
      user: { id: string; email?: string };
      profile: Profile;
      adminId: string;
      supabase: SupabaseClient;
      isSuperAdmin: boolean;
      isImpersonating: boolean;
    };

export async function getSessionWithAdmin(): Promise<SessionWithAdmin> {
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

  const typedProfile = profile as Profile;
  const superAdmin = isSuperAdmin(typedProfile);
  const impersonateAdminId = superAdmin ? await getImpersonatedAdminId() : null;

  let adminId = getOrganizationAdminId(typedProfile);
  let dataClient: SupabaseClient = supabase;
  let isImpersonating = false;

  if (superAdmin && impersonateAdminId) {
    adminId = impersonateAdminId;
    dataClient = createAdminClient();
    isImpersonating = true;
  }

  return {
    user,
    profile: typedProfile,
    adminId,
    supabase: dataClient,
    isSuperAdmin: superAdmin,
    isImpersonating,
  };
}
