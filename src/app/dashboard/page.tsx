import { Suspense } from "react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PageShell from "@/components/dashboard/PageShell";

export default async function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Visão operacional do plantão: Kanban, medicações, riscos e ações rápidas."
    >
      <Suspense
        fallback={
          <p className="text-sm text-navy-800/60">Carregando dashboard...</p>
        }
      >
        <DashboardOverview />
      </Suspense>
    </PageShell>
  );
}
