"use client";

import type { Profile } from "@/lib/types/profile";
import { getProfileAvatarUrl } from "@/lib/profile/avatar";
import {
  ACCOUNT_PASSWORD_HINT,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-policy";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type ProfileSettingsAppProps = {
  initialProfile: Profile;
  userEmail: string;
  isAdmin: boolean;
};

type Message = { type: "success" | "error"; text: string } | null;

const inputClass =
  "w-full rounded-xl border border-ocean-100 bg-white px-4 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-ocean-500";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileSettingsApp({
  initialProfile,
  userEmail,
  isAdmin,
}: ProfileSettingsAppProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState<Message>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: initialProfile.full_name ?? "",
    phone: initialProfile.phone ?? "",
    specialty: initialProfile.specialty ?? "",
    bio: initialProfile.bio ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const displayName = profile.full_name ?? userEmail;
  const avatarUrl = useMemo(
    () => getProfileAvatarUrl(profile.avatar_url),
    [profile.avatar_url],
  );
  const initials = getInitials(displayName) || "U";
  const roleLabel = isAdmin ? "Administrador da clínica" : "Sub-usuário";

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSavingProfile(true);

    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao salvar perfil." });
        return;
      }

      setProfile(data.profile);
      setMessage({ type: "success", text: "Perfil atualizado com sucesso." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar perfil." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/perfil/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao enviar foto." });
        return;
      }

      setProfile(data.profile);
      setMessage({ type: "success", text: "Foto de perfil atualizada." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Erro ao enviar foto." });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSavingPassword(true);

    try {
      const res = await fetch("/api/perfil/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao alterar senha." });
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Senha alterada com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Erro ao alterar senha." });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-navy-950">Foto de perfil</h2>
        <p className="mt-1 text-sm text-navy-800/60">
          JPG, PNG ou WebP. Tamanho máximo de 2 MB.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-100 ring-4 ring-ocean-50">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-ocean-800">
                {initials}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="rounded-lg border border-ocean-200 bg-ocean-50 px-4 py-2 text-sm font-medium text-ocean-900 transition-all hover:-translate-y-0.5 hover:bg-ocean-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingAvatar ? "Enviando..." : "Escolher nova foto"}
            </button>
            <p className="text-xs text-navy-800/50">{roleLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-navy-950">
          Informações pessoais
        </h2>
        <p className="mt-1 text-sm text-navy-800/60">
          Atualize seus dados visíveis no painel da clínica.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Nome completo
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              E-mail
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className={`${inputClass} cursor-not-allowed bg-navy-50 text-navy-800/60`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Telefone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Especialidade
            </label>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) =>
                setForm({ ...form, specialty: e.target.value })
              }
              placeholder="Ex.: Cardiologia, Emergência, Pediatria"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Bio
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Conte brevemente sobre sua formação, experiência e área de atuação."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1 text-right text-xs text-navy-800/45">
              {form.bio.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-ocean-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProfile ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-navy-950">Alterar senha</h2>
        <p className="mt-1 text-sm text-navy-800/60">
          Informe a senha atual para definir uma nova.
        </p>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/70">
              Senha atual
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Nova senha
              </label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className={inputClass}
              />
              <p className="mt-1 text-xs text-navy-800/55">{ACCOUNT_PASSWORD_HINT}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800/70">
                Confirmar nova senha
              </label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg border border-navy-900/12 px-5 py-2.5 text-sm font-medium text-navy-800 transition-all hover:-translate-y-0.5 hover:border-ocean-300 hover:bg-ocean-50 hover:text-ocean-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPassword ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
