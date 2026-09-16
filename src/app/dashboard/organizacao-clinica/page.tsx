import PageShell from "@/components/dashboard/PageShell";
import OrganizacaoManager from "@/components/dashboard/organizacao/OrganizacaoManager";
import {
  isAdmin,
  requireSessionProfile,
} from "@/lib/auth/get-session-profile";

export default async function OrganizacaoClinicaPage() {
  const { profile } = await requireSessionProfile();
  const admin = isAdmin(profile);

  return (
    <PageShell
      title="Organização Clínica"
      description={
        admin
          ? "Gerencie sub-usuários, equipes e alocação de membros."
          : "Visualize os usuários e equipes da sua clínica."
      }
    >
      <OrganizacaoManager isAdmin={admin} />
    </PageShell>
  );
}
