import AuthForm from "@/components/auth/AuthForm";
import AuthPageShell from "@/components/auth/AuthPageShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar — MEDScript",
  description: "Acesse sua conta MEDScript.",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Entrar"
      subtitle="Acesse o painel da sua clínica."
      alternateLabel="Ainda não tem conta?"
      alternateHref="/cadastro"
      alternateLinkText="Criar conta"
      fixedViewport
    >
      <AuthForm mode="login" compact />
    </AuthPageShell>
  );
}
