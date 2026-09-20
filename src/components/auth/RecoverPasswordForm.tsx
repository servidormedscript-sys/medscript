"use client";

import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-ocean-100 bg-white px-4 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-ocean-500";

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback?next=/redefinir-senha`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setMessage({ type: "error", text: translateAuthError(error.message) });
        return;
      }

      setMessage({
        type: "success",
        text: "Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada e o spam.",
      });
      setEmail("");
    } catch {
      setMessage({
        type: "error",
        text: "Não foi possível enviar o e-mail. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="recover-email"
            className="mb-1 block text-xs font-medium text-navy-800/70"
          >
            E-mail da conta
          </label>
          <input
            id="recover-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="seu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ocean-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar link de recuperação"}
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

      <p className="mt-4 text-center text-xs text-navy-800/55">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-ocean-800 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
