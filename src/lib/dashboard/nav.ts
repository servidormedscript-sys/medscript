export type DashboardNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
};

export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/meu-paciente-grave", label: "Meu Paciente Grave" },
  { href: "/dashboard/relatorio-pacientes", label: "Relatório de Pacientes" },
  { href: "/dashboard/protocolos-clinicos", label: "Protocolos Clínicos" },
  { href: "/dashboard/escola-emergencia", label: "Escola de Emergência" },
  {
    href: "/dashboard/organizacao-clinica",
    label: "Organização Clínica",
  },
  { href: "/dashboard/documentacoes", label: "Documentações" },
  { href: "/dashboard/agenda", label: "Agenda de Plantões" },
  { href: "/dashboard/ranking-resumo", label: "Ranking e Resumo" },
  {
    href: "/dashboard/admin-plataforma",
    label: "Administração do site",
    superAdminOnly: true,
  },
];
