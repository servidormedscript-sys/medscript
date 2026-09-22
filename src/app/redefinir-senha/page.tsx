import AuthPageShell from "@/components/auth/AuthPageShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha para sua conta MEDScript.",
  robots: { index: false, follow: false },
};

export default function RedefinirSenhaPage() {
  return (
    <AuthPageShell
      title="Nova senha"
      subtitle="Escolha uma senha segura para sua conta."
      alternateLabel="Voltar ao"
      alternateHref="/login"
      alternateLinkText="login"
      fixedViewport
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
