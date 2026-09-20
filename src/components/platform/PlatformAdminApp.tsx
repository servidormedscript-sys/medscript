"use client";

import { useCallback, useEffect, useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useRouter } from "next/navigation";

type ClinicAdminRow = {
  id: string;
  email: string;
  full_name: string | null;
  account_status: string;
  sub_users_count: number;
  subscription: {
    access_ends_at: string | null;
    paid_days_total: number;
    complimentary_access: boolean;
    status: string;
  } | null;
};

type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export default function PlatformAdminApp() {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [tab, setTab] = useState<"users" | "support">("users");
  const [clinicAdmins, setClinicAdmins] = useState<ClinicAdminRow[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/platform/users");
    const data = await res.json();
    if (res.ok) setClinicAdmins(data.clinicAdmins ?? []);
  }, []);

  const loadSupport = useCallback(async () => {
    const res = await fetch("/api/support");
    const data = await res.json();
    if (res.ok) setSupportMessages(data.messages ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadSupport()]);
    setLoading(false);
  }, [loadUsers, loadSupport]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function patchUser(id: string, payload: Record<string, unknown>) {
    setMessage(null);
    const res = await fetch(`/api/platform/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro na operação." });
      return false;
    }
    await loadUsers();
    setMessage({ type: "success", text: "Alteração salva." });
    return true;
  }

  async function handleImpersonate(adminId: string, label: string) {
    const ok = await confirm({
      title: "Abrir painel da clínica?",
      description: `Você verá o dashboard como ${label}. Pode sair a qualquer momento.`,
      confirmLabel: "Abrir painel",
      tone: "default",
    });
    if (!ok) return;

    const res = await fetch("/api/platform/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao abrir painel." });
      return;
    }
    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-navy-900/8">
        {(["users", "support"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-b-2 border-navy-900 text-navy-950"
                : "text-navy-800/50 hover:text-navy-800"
            }`}
          >
            {key === "users" ? "Contas de clínicas" : "Suporte"}
          </button>
        ))}
      </div>

      {message ? (
        <p
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-900"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-navy-800/60">Carregando...</p>
      ) : tab === "users" ? (
        <div className="space-y-4">
          {clinicAdmins.map((admin) => (
            <article
              key={admin.id}
              className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-navy-950">
                    {admin.full_name ?? "Sem nome"} · {admin.email}
                  </h2>
                  <p className="mt-1 text-xs text-navy-800/60">
                    Status: {admin.account_status} · Sub-usuários: {admin.sub_users_count} ·
                    Dias pagos acumulados: {admin.subscription?.paid_days_total ?? 0}
                    {admin.subscription?.complimentary_access ? " · Acesso liberado" : ""}
                  </p>
                  {admin.subscription?.access_ends_at ? (
                    <p className="text-xs text-navy-800/60">
                      Acesso até:{" "}
                      {new Date(admin.subscription.access_ends_at).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleImpersonate(admin.id, admin.full_name ?? admin.email)
                    }
                    className="rounded-full border border-ocean-200 px-3 py-1.5 text-xs font-semibold text-ocean-900"
                  >
                    Ver painel
                  </button>
                  <button
                    type="button"
                    onClick={() => patchUser(admin.id, { action: "add_days", days: 30 })}
                    className="rounded-full bg-ocean-800 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    +30 dias
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchUser(admin.id, {
                        action: "complimentary_access",
                        complimentary: true,
                        complimentary_note: "Liberado pelo admin do site",
                      })
                    }
                    className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                  >
                    Liberar acesso
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchUser(admin.id, { action: "set_status", account_status: "blocked" })
                    }
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    Bloquear
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchUser(admin.id, { action: "set_status", account_status: "active" })
                    }
                    className="rounded-full border border-navy-900/10 px-3 py-1.5 text-xs"
                  >
                    Reativar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const email = window.prompt("Novo e-mail:", admin.email);
                      if (!email?.trim()) return;
                      patchUser(admin.id, { action: "update_email", email: email.trim() });
                    }}
                    className="rounded-full border border-navy-900/10 px-3 py-1.5 text-xs"
                  >
                    Alterar e-mail
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const password = window.prompt("Nova senha (mín. 6 caracteres):");
                      if (!password) return;
                      patchUser(admin.id, { action: "update_password", password });
                    }}
                    className="rounded-full border border-navy-900/10 px-3 py-1.5 text-xs"
                  >
                    Alterar senha
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Desativar conta?",
                        description: "O usuário não poderá entrar até reativar.",
                        confirmLabel: "Desativar",
                        tone: "danger",
                      });
                      if (!ok) return;
                      patchUser(admin.id, {
                        action: "set_status",
                        account_status: "deactivated",
                      });
                    }}
                    className="rounded-full border border-navy-900/10 px-3 py-1.5 text-xs"
                  >
                    Desativar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Excluir conta permanentemente?",
                        description:
                          "Remove o admin da clínica e dados vinculados no auth. Ação irreversível.",
                        confirmLabel: "Excluir",
                        tone: "danger",
                      });
                      if (!ok) return;
                      const res = await fetch(`/api/platform/users/${admin.id}`, {
                        method: "DELETE",
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setMessage({ type: "error", text: data.error ?? "Erro ao excluir." });
                        return;
                      }
                      loadUsers();
                      setMessage({ type: "success", text: "Conta excluída." });
                    }}
                    className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-800"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {supportMessages.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-navy-900/8 bg-white p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-navy-950">{item.subject}</h3>
                <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs text-ocean-900">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-navy-800/75">{item.message}</p>
              <p className="mt-2 text-xs text-navy-800/50">
                {item.guest_name ?? "Usuário"} · {item.guest_email ?? "—"} ·{" "}
                {new Date(item.created_at).toLocaleString("pt-BR")}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/platform/support/${item.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "closed" }),
                    });
                    loadSupport();
                  }}
                  className="rounded-full border px-3 py-1 text-xs"
                >
                  Fechar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
