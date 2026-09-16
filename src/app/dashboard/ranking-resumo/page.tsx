import PageShell from "@/components/dashboard/PageShell";
import ShiftRankingApp from "@/components/dashboard/ranking/ShiftRankingApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking e Resumo — MEDScript",
  description:
    "Resumo de plantões, rankings de equipes e profissionais por horas realizadas.",
};

export default function RankingResumoPage() {
  return (
    <PageShell
      title="Ranking e Resumo"
      description="Acompanhe seus plantões, filtre por mês e compare a produtividade da clínica."
    >
      <ShiftRankingApp />
    </PageShell>
  );
}
