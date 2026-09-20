import PageShell from "@/components/dashboard/PageShell";
import PlatformAdminApp from "@/components/platform/PlatformAdminApp";
import { requireSessionProfile } from "@/lib/auth/get-session-profile";
import { isSuperAdmin } from "@/lib/platform/super-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPlataformaPage() {
  const { profile } = await requireSessionProfile();
  if (!isSuperAdmin(profile)) {
    redirect("/dashboard");
  }

  return (
    <PageShell
      title="Administração do site"
      description="Contas de clínicas, planos, bloqueios e mensagens de suporte."
    >
      <PlatformAdminApp />
    </PageShell>
  );
}
