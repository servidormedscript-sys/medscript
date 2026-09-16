import AuthForm from "@/components/auth/AuthForm";
import AuthPageShell from "@/components/auth/AuthPageShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro — MEDScript",
  description: "Crie sua conta e comece a avaliação gratuita de 14 dias.",
};

export default function CadastroPage() {
  return (
    <AuthPageShell
      title="Criar conta"
      subtitle="14 dias de avaliação gratuita. Sem cartão."
      alternateLabel="Já tem conta?"
      alternateHref="/login"
      alternateLinkText="Entrar"
      fixedViewport
      logoClassName="h-12 w-auto sm:h-14"
    >
      <AuthForm mode="register" compact />
    </AuthPageShell>
  );
}
