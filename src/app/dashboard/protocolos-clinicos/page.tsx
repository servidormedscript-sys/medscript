import { Suspense } from "react";
import PageShell from "@/components/dashboard/PageShell";
import ClinicalProtocolsApp from "@/components/dashboard/protocolos/ClinicalProtocolsApp";

export default async function ProtocolosClinicosPage() {
  return (
    <PageShell
      title="Protocolos Clínicos"
      description="Biblioteca de protocolos assistenciais com cálculo automático de doses por peso e idade."
    >
      <Suspense
        fallback={
          <p className="text-sm text-navy-800/60">Carregando protocolos...</p>
        }
      >
        <ClinicalProtocolsApp />
      </Suspense>
    </PageShell>
  );
}
