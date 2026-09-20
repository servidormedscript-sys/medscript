"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type SupportRequestButtonProps = {
  variant?: "landing" | "header";
};

export default function SupportRequestButton({
  variant = "header",
}: SupportRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    subject: "",
    message: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao enviar." });
        return;
      }
      setMessage({
        type: "success",
        text: data.message ?? "Mensagem enviada com sucesso.",
      });
      setForm({ guest_name: "", guest_email: "", subject: "", message: "" });
    } catch {
      setMessage({ type: "error", text: "Erro ao enviar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  const buttonClass =
    variant === "landing"
      ? "inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-white px-4 py-2 text-sm font-medium text-ocean-900 shadow-sm hover:bg-ocean-50"
      : "inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-ocean-50 px-4 py-2 text-sm font-semibold text-ocean-900 transition hover:bg-ocean-100";

  const modal =
    open && mounted ? (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-dialog-title"
      >
        <button
          type="button"
          className="fixed inset-0 bg-navy-950/55 backdrop-blur-[2px]"
          aria-label="Fechar"
          onClick={() => setOpen(false)}
        />
        <div className="relative my-auto w-full max-w-lg max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto rounded-2xl border border-ocean-100 bg-white shadow-2xl shadow-navy-950/20">
          <div className="border-b border-navy-900/8 px-6 py-4">
            <h2 id="support-dialog-title" className="text-lg font-semibold text-navy-950">
              Suporte e sugestões
            </h2>
            <p className="mt-1 text-sm text-navy-800/65">
              Conte o que aconteceu ou envie uma ideia para melhorar o MEDScript.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 px-6 py-5">
            {variant === "landing" ? (
              <>
                <input
                  required
                  placeholder="Seu nome"
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  className="w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="Seu e-mail"
                  value={form.guest_email}
                  onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                  className="w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                />
              </>
            ) : null}
            <input
              required
              placeholder="Assunto"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
            />
            <textarea
              required
              rows={4}
              placeholder="Descreva sua dúvida, problema ou sugestão"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
            />
            {message ? (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-900"
                    : "bg-amber-50 text-amber-900"
                }`}
              >
                {message.text}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-navy-900/12 px-4 py-2 text-sm"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ocean-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Suporte / Sugestão
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
