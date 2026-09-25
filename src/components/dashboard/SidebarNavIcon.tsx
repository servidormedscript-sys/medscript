type SidebarNavIconProps = {
  href: string;
  active?: boolean;
};

export default function SidebarNavIcon({ href, active = false }: SidebarNavIconProps) {
  const className = active ? "text-med-red" : "text-white/45";

  switch (href) {
    case "/dashboard":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case "/dashboard/meu-paciente-grave":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20.5s-6.5-4.2-6.5-9a4.5 4.5 0 0 1 8.1-2.7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M12 20.5s6.5-4.2 6.5-9a4.5 4.5 0 0 0-8.1-2.7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M12 11.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/dashboard/relatorio-pacientes":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 19V5M5 19h14M9 15v-3M13 15V9M17 15v-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "/dashboard/protocolos-clinicos":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 4h8l1 2h3v14H4V6h3l1-2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/dashboard/escola-emergencia":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 2 9l10 6 10-6-10-6Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M6 11v5.5c0 .8 2.7 2.5 6 2.5s6-1.7 6-2.5V11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 9v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/dashboard/organizacao-clinica":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V9l8-4 8 4v11" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M9 20v-5h6v5M9 12h1M14 12h1M9 9h1M14 9h1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/dashboard/documentacoes":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4h8l4 4v12H6V4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M14 4v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/dashboard/agenda":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 4V2M17 4V2M4 9h16M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M8 13h2v2H8v-2ZM11 13h2v2h-2v-2ZM14 13h2v2h-2v-2Z" fill="currentColor" />
        </svg>
      );
    case "/dashboard/ranking-resumo":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 19V5M5 19h14M9 15v-3M13 15V9M17 15v-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "/assinatura":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "/dashboard/admin-plataforma":
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 4 7v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M9 12.5 11 14.5 15.5 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
  }
}