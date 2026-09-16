"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthMode = "login" | "register";

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-ocean-100 bg-white px-3 py-2 text-sm text-navy-900 outline-none transition-colors focus:border-ocean-500 sm:px-4 sm:py-2.5";

type AuthFormProps = {
  mode: AuthMode;
  compact?: boolean;
};

export default function AuthForm({ mode, compact = false }: AuthFormProps) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  async function handleGoogleAuth() {
    setGoogleLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setMessage({ type: "error", text: `Não foi possível conectar: ${error.message}` });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Verifique as variáveis de ambiente do Supabase no arquivo .env.local.",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const { full_name, email, password, confirmPassword } = registerForm;

    if (!full_name.trim()) {
      setMessage({ type: "error", text: "Informe seu nome completo." });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setFormLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            role: "admin",
          },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setMessage({
        type: "success",
        text: "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
      });
      setRegisterForm({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch {
      setMessage({ type: "error", text: "Erro ao criar conta. Tente novamente." });
    } finally {
      setFormLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFormLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const raw = await response.text();
      let data: { error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      } catch {
        data = { error: raw || "Erro ao entrar. Tente novamente." };
      }

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Erro ao entrar. Tente novamente.",
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Erro ao entrar. Tente novamente." });
    } finally {
      setFormLoading(false);
    }
  }

  const isLoading = googleLoading || formLoading;
  const isRegisterCompact = compact && mode === "register";
  const wrapperClass = isRegisterCompact
    ? "p-3 sm:p-4"
    : compact
      ? "p-4 sm:p-5"
      : "p-6 md:p-8";
  const fieldGap = isRegisterCompact
    ? "space-y-2"
    : compact
      ? "space-y-3"
      : "space-y-4";
  const dividerMy = isRegisterCompact ? "my-2.5" : compact ? "my-4" : "my-6";
  const legalMt = isRegisterCompact ? "mt-2" : compact ? "mt-3" : "mt-6";
  const buttonClass =
    "w-full rounded-full bg-ocean-800 text-sm font-semibold text-white transition-colors hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60 " +
    (isRegisterCompact ? "py-2" : "py-2.5");
  const googleButtonClass =
    "flex w-full items-center justify-center gap-2 rounded-full border border-ocean-100 bg-white text-sm font-medium text-navy-900 transition-colors hover:bg-ocean-50 disabled:cursor-not-allowed disabled:opacity-60 " +
    (isRegisterCompact ? "px-4 py-2" : "gap-3 px-5 py-2.5");

  return (
    <div className={wrapperClass}>
      {mode === "register" ? (
        <form
          onSubmit={handleRegister}
          className={
            isRegisterCompact
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : fieldGap
          }
        >
          <div className={isRegisterCompact ? "sm:col-span-2" : undefined}>
            <label
              htmlFor="register-name"
              className="mb-1 block text-xs font-medium text-navy-800/70"
            >
              Nome completo
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              value={registerForm.full_name}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  full_name: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div className={isRegisterCompact ? "sm:col-span-2" : undefined}>
            <label
              htmlFor="register-email"
              className="mb-1 block text-xs font-medium text-navy-800/70"
            >
              E-mail
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  email: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="mb-1 block text-xs font-medium text-navy-800/70"
            >
              Senha
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  password: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="register-confirm"
              className="mb-1 block text-xs font-medium text-navy-800/70"
            >
              Confirmar senha
            </label>
            <input
              id="register-confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={registerForm.confirmPassword}
              onChange={(e) =>
                setRegisterForm({
                  ...registerForm,
                  confirmPassword: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`${buttonClass} ${isRegisterCompact ? "sm:col-span-2" : ""}`}
          >
            {formLoading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className={fieldGap}>
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-xs font-medium text-navy-800/70"
            >
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-navy-800/70"
              >
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="text-[11px] font-medium text-ocean-800 hover:underline sm:text-xs"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={isLoading} className={buttonClass}>
            {formLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      )}

      <div className={`relative ${dividerMy}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy-900/8" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-navy-800/50">
            ou continue com
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={googleButtonClass}
      >
        <GoogleIcon />
        {googleLoading ? "Conectando..." : "Google"}
      </button>

      {message && (
        <p
          className={`${isRegisterCompact ? "mt-2" : "mt-4"} rounded-md border px-3 py-2 text-xs sm:text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {message.text}
        </p>
      )}

      <p
        className={`${legalMt} ${
          isRegisterCompact
            ? "text-center text-[10px] leading-snug text-navy-800/45"
            : "text-[11px] leading-relaxed text-navy-800/50 sm:text-xs"
        }`}
      >
        Ao continuar, você aceita os{" "}
        <Link href="/termos-de-uso" className="text-ocean-800 hover:underline">
          Termos
        </Link>
        ,{" "}
        <Link href="/termos-e-condicoes" className="text-ocean-800 hover:underline">
          Condições
        </Link>{" "}
        e a{" "}
        <Link href="/lgpd" className="text-ocean-800 hover:underline">
          LGPD
        </Link>
        .
      </p>
    </div>
  );
}
