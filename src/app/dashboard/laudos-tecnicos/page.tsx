import PageShell from "@/components/dashboard/PageShell";
import PlaceholderContent from "@/components/dashboard/PlaceholderContent";

export default async function LaudosTecnicosPage() {
  return (
    <PageShell
      title="Laudos Técnicos"
      description="Emissão e gestão de laudos técnicos."
    >
      <PlaceholderContent message="Módulo de laudos técnicos em desenvolvimento." />
    </PageShell>
  );
}
