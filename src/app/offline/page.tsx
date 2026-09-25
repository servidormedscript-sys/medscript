import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandLogo size="header" className="mx-auto" />
      <h1 className="mt-8 text-xl font-semibold text-navy-950">
        Você está offline
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy-800/70">
        Verifique a internet e tente novamente. Algumas telas podem abrir do cache
        quando a conexão voltar.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-full bg-ocean-800 px-6 py-2.5 text-sm font-medium text-white"
      >
        Ir ao painel
      </Link>
    </div>
  );
}
