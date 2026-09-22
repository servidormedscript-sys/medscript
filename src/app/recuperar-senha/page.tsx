import AuthPageShell from "@/components/auth/AuthPageShell";
import RecoverPasswordForm from "@/components/auth/RecoverPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba um link para redefinir sua senha MEDScript.",
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return (
    <AuthPageShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para o seu e-mail."
      alternateLabel="Lembrou a senha?"
      alternateHref="/login"
      alternateLinkText="Entrar"
      fixedViewport
    >
      <RecoverPasswordForm />
    </AuthPageShell>
  );
}
