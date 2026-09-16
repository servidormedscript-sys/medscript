import { Suspense } from "react";
import PageShell from "@/components/dashboard/PageShell";
import PatientGraveT0 from "@/components/dashboard/meu-paciente-grave/PatientGraveT0";

export default async function MeuPacienteGravePage() {
  return (
    <PageShell
      title="Meu Paciente Grave"
      description="Avaliação clínica inicial (T0) de pacientes ativos com sugestões assistenciais."
    >
      <Suspense
        fallback={
          <p className="text-sm text-navy-800/60">Carregando avaliação T0...</p>
        }
      >
        <PatientGraveT0 />
      </Suspense>
    </PageShell>
  );
}