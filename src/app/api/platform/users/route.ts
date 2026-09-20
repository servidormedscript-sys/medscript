import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/require-super-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { admin } = auth;

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, role, user_type, parent_admin_id, account_status, platform_role, created_at"
    )
    .order("created_at", { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: "Erro ao listar usuários." }, { status: 500 });
  }

  const clinicAdmins = (profiles ?? []).filter(
    (p) => p.role === "admin" && !p.platform_role
  );

  const adminIds = clinicAdmins.map((p) => p.id);
  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select(
      "user_id, status, access_ends_at, trial_ends_at, paid_days_total, complimentary_access, complimentary_note"
    )
    .in("user_id", adminIds.length ? adminIds : ["00000000-0000-0000-0000-000000000000"]);

  const subCounts = new Map<string, number>();
  for (const profile of profiles ?? []) {
    if (profile.parent_admin_id) {
      subCounts.set(
        profile.parent_admin_id,
        (subCounts.get(profile.parent_admin_id) ?? 0) + 1
      );
    }
  }

  const subscriptionMap = new Map(
    (subscriptions ?? []).map((sub) => [sub.user_id, sub] as const)
  );

  const users = clinicAdmins.map((adminProfile) => ({
    ...adminProfile,
    sub_users_count: subCounts.get(adminProfile.id) ?? 0,
    subscription: subscriptionMap.get(adminProfile.id) ?? null,
  }));

  const subUsers = (profiles ?? []).filter((p) => p.role === "member");

  return NextResponse.json({ clinicAdmins: users, subUsers });
}
