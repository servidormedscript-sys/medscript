"use client";

import { createClient } from "@/lib/supabase/client";
import {
  ACCOUNT_PASSWORD_HINT,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  validateAccountPassword,
} from "@/lib/auth/password-policy";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-ocean-100 bg-white px-4 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-ocean-500";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const passwordError = validateAccountPassword(password);
    if (passwordError) {
      setMessage({ type: "error", text: passwordError });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({ type: "error", text: translateAuthError(error.message) });
        return;
      }

      setMessage({
        type: "success",
        text: "Senha atualizada com sucesso. Redirecionando...",
      });

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch {
      setMessage({ type: "error", text: "Erro ao redefinir senha. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="p-4 sm:p-5 text-center text-sm text-navy-800/60">
        Validando link...
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-4 p-4 sm:p-5 text-center">
        <p className="text-sm text-navy-800/70">
          Link inválido ou expirado. Solicite uma nova recuperação de senha.
        </p>
        <Link
          href="/recuperar-senha"
          className="inline-block rounded-full bg-ocean-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700"
        >
          Recuperar senha
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="new-password"
            className="mb-1 block text-xs font-medium text-navy-800/70"
          >
            Nova senha
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-navy-800/55">{ACCOUNT_PASSWORD_HINT}</p>
        </div>
        <div>
          <label
            htmlFor="confirm-new-password"
            className="mb-1 block text-xs font-medium text-navy-800/70"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirm-new-password"
            type="password"
            required
            minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ocean-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
