import { Suspense } from "react";
import PageShell from "@/components/dashboard/PageShell";
import PatientKanbanBoard from "@/components/dashboard/pacientes/PatientKanbanBoard";

export default async function RelatorioPacientesPage() {
  return (
    <PageShell
      title="Relatório de Pacientes"
      description="Kanban de movimentação clínica: triagem, observação, internação e alta."
    >
      <Suspense
        fallback={
          <p className="text-sm text-navy-800/60">Carregando relatório...</p>
        }
      >
        <PatientKanbanBoard />
      </Suspense>
    </PageShell>
  );
}
