import PageShell from "@/components/dashboard/PageShell";
import DocumentacoesApp from "@/components/dashboard/documentacoes/DocumentacoesApp";
import { requireSessionProfile, isAdmin } from "@/lib/auth/get-session-profile";

export default async function DocumentacoesPage() {
  const { profile } = await requireSessionProfile();

  return (
    <PageShell
      title="Documentações"
      description={
        isAdmin(profile)
          ? "Gerencie cards com documentos institucionais, descrições e acesso privado ou liberado."
          : "Consulte os documentos anexados pela administração da clínica."
      }
    >
      <DocumentacoesApp isAdmin={isAdmin(profile)} />
    </PageShell>
  );
}
