import { Suspense } from "react";
import PageShell from "@/components/dashboard/PageShell";
import EmergencySchoolApp from "@/components/dashboard/escola/EmergencySchoolApp";
import {
  getSessionProfile,
  isAdmin,
} from "@/lib/auth/get-session-profile";

export default async function EscolaEmergenciaPage() {
  const { profile } = await getSessionProfile();

  return (
    <PageShell
      title="Escola de Emergência"
      description="Trilha de desenvolvimento com módulos progressivos para plantonistas e estudantes."
    >
      <Suspense
        fallback={
          <p className="text-sm text-navy-800/60">Carregando escola...</p>
        }
      >
        <EmergencySchoolApp
          isAdmin={isAdmin(profile)}
          userType={profile?.user_type ?? null}
        />
      </Suspense>
    </PageShell>
  );
}
