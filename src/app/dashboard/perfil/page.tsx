import PageShell from "@/components/dashboard/PageShell";
import ProfileSettingsApp from "@/components/dashboard/perfil/ProfileSettingsApp";
import {
  isAdmin,
  requireSessionProfile,
} from "@/lib/auth/get-session-profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil — MEDScript",
  description: "Gerencie foto, bio, telefone e senha da sua conta.",
};

export default async function PerfilPage() {
  const { user, profile } = await requireSessionProfile();

  if (!profile) {
    return null;
  }

  return (
    <PageShell
      title="Perfil e configurações"
      description="Atualize sua foto, dados profissionais e senha de acesso."
    >
      <ProfileSettingsApp
        initialProfile={profile}
        userEmail={user.email ?? profile.email}
        isAdmin={isAdmin(profile)}
      />
    </PageShell>
  );
}
