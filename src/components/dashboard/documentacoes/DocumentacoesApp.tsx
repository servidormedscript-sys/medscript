"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentationCardPublic, DocumentationFile } from "@/lib/documentation/types";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const UNLOCK_STORAGE_KEY = "medscript.unlocked-doc-cards";

function readUnlockedCards() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (!raw) return new Set<string>();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeUnlockedCards(ids: Set<string>) {
  sessionStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify([...ids]));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocumentacoesAppProps = {
  isAdmin: boolean;
};

export default function DocumentacoesApp({ isAdmin }: DocumentacoesAppProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [cards, setCards] = useState<DocumentationCardPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlockPasswords, setUnlockPasswords] = useState<Record<string, string>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    is_protected: false,
    password: "",
  });

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documentacoes/cards");
      const data = await res.json();
      if (res.ok) {
        setCards(data.cards ?? []);
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao carregar documentações." });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnlockedIds(readUnlockedCards());
    loadCards();
  }, [loadCards]);

  function isCardAccessible(card: DocumentationCardPublic) {
    return isAdmin || !card.is_protected || unlockedIds.has(card.id);
  }

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/documentacoes/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao criar card." });
      return;
    }

    setCards((current) => [...current, data.card]);
    setForm({ title: "", description: "", is_protected: false, password: "" });
    setShowCreateForm(false);
    setMessage({ type: "success", text: "Card criado com sucesso." });
  }

  useEffect(() => {
    setUnlockedIds(readUnlockedCards());
    loadCards();
  }, [loadCards]);

  useClinicRealtime(loadCards);

  async function handleDeleteCard(cardId: string) {
    const confirmed = await confirm({
      title: "Excluir card de documentação?",
      description:
        "Esta ação remove o card e todos os anexos vinculados. Não é possível desfazer.",
      confirmLabel: "Excluir card",
      tone: "danger",
    });
    if (!confirmed) return;

    const res = await fetch(`/api/documentacoes/cards/${cardId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao excluir card." });
      return;
    }

    setCards((current) => current.filter((card) => card.id !== cardId));
    setMessage({ type: "success", text: "Card excluído." });
  }

  async function handleUpload(cardId: string, fileList: FileList | null) {
    if (!fileList?.length) return;

    setUploadingCardId(cardId);
    setMessage(null);

    const formData = new FormData();
    Array.from(fileList).forEach((file) => formData.append("files", file));

    const res = await fetch(`/api/documentacoes/cards/${cardId}/files`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploadingCardId(null);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao enviar arquivos." });
      return;
    }

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              file_count: (card.documentation_files?.length ?? 0) + data.files.length,
              documentation_files: [...(card.documentation_files ?? []), ...data.files],
            }
          : card
      )
    );

    setMessage({ type: "success", text: "Arquivo(s) anexado(s)." });
  }

  async function handleDeleteFile(cardId: string, fileId: string) {
    const confirmed = await confirm({
      title: "Remover anexo?",
      description: "O arquivo será excluído permanentemente deste card.",
      confirmLabel: "Remover anexo",
      tone: "danger",
    });
    if (!confirmed) return;

    const res = await fetch(`/api/documentacoes/files/${fileId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao remover arquivo." });
      return;
    }

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              file_count: Math.max(0, card.file_count - 1),
              documentation_files: (card.documentation_files ?? []).filter(
                (file) => file.id !== fileId
              ),
            }
          : card
      )
    );
  }

  async function handleUnlock(cardId: string) {
    setMessage(null);

    const res = await fetch(`/api/documentacoes/cards/${cardId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: unlockPasswords[cardId] ?? "" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Senha incorreta." });
      return;
    }

    setUnlockedIds((current) => {
      const next = new Set(current);
      next.add(cardId);
      writeUnlockedCards(next);
      return next;
    });

    setUnlockPasswords((current) => ({ ...current, [cardId]: "" }));
    setMessage({ type: "success", text: "Acesso liberado nesta sessão." });
  }

  async function handleDownload(file: DocumentationFile, card: DocumentationCardPublic) {
    const password = unlockPasswords[card.id];
    const params = password ? `?password=${encodeURIComponent(password)}` : "";
    const res = await fetch(`/api/documentacoes/files/${file.id}${params}`);
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao baixar arquivo." });
      return;
    }

    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <p className="text-sm text-navy-800/60">Carregando documentações…</p>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-navy-800/65">
            Crie cards com título, descrição e anexos. Cards privados exigem senha para
            sub-usuários.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="shrink-0 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white hover:bg-ocean-700"
          >
            {showCreateForm ? "Cancelar" : "Novo card"}
          </button>
        </div>
      )}

      {!isAdmin && (
        <p className="text-sm text-navy-800/65">
          Visualize os documentos anexados pela administração da clínica. Cards privados
          exigem senha.
        </p>
      )}

      {showCreateForm && isAdmin && (
        <form
          onSubmit={handleCreateCard}
          className="rounded-xl border border-navy-900/10 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-navy-950">Novo card de documentação</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-navy-900">Título</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-navy-900">Descrição</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_protected}
                onChange={(e) =>
                  setForm((current) => ({ ...current, is_protected: e.target.checked }))
                }
              />
              <span className="text-sm text-navy-900">Privar com senha</span>
            </label>
            {form.is_protected && (
              <label className="block">
                <span className="text-sm font-medium text-navy-900">Senha do card</span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, password: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-navy-900/12 px-3 py-2 text-sm"
                />
              </label>
            )}
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
          >
            Criar card
          </button>
        </form>
      )}

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-navy-900/15 bg-white p-10 text-center">
          <p className="text-sm text-navy-800/60">
            {isAdmin
              ? "Nenhum card cadastrado. Crie o primeiro card de documentação."
              : "Nenhum documento disponível no momento."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {cards.map((card) => {
            const accessible = isCardAccessible(card);
            const files = card.documentation_files ?? [];

            return (
              <article
                key={card.id}
                className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-navy-950">{card.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          card.is_protected
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {card.is_protected ? "Privado" : "Liberado"}
                      </span>
                    </div>
                    {card.description && (
                      <p className="mt-2 text-sm text-navy-800/70">{card.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </button>
                  )}
                </div>

                {card.is_protected && !accessible && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-900">
                      Este card é privado. Informe a senha para visualizar os anexos.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="password"
                        value={unlockPasswords[card.id] ?? ""}
                        onChange={(e) =>
                          setUnlockPasswords((current) => ({
                            ...current,
                            [card.id]: e.target.value,
                          }))
                        }
                        placeholder="Senha"
                        className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleUnlock(card.id)}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                      >
                        Desbloquear
                      </button>
                    </div>
                  </div>
                )}

                {accessible && (
                  <div className="mt-4 space-y-3">
                    {files.length === 0 ? (
                      <p className="text-sm text-navy-800/50">Nenhum anexo ainda.</p>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-navy-900/8 bg-navy-50/50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-navy-950">
                                {file.file_name}
                              </p>
                              <p className="text-xs text-navy-800/50">
                                {formatFileSize(file.file_size)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownload(file, card)}
                                className="rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-navy-800 ring-1 ring-navy-900/10 hover:bg-navy-50"
                              >
                                Abrir
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(card.id, file.id)}
                                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isAdmin && (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-navy-900/15 bg-navy-50/30 px-4 py-4 text-center hover:bg-navy-50/60">
                        <span className="text-sm font-medium text-navy-800">
                          {uploadingCardId === card.id
                            ? "Enviando…"
                            : "Anexar um ou mais arquivos"}
                        </span>
                        <span className="mt-1 text-xs text-navy-800/50">PDF, Word, Excel, imagens · máx. 10 MB</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          disabled={uploadingCardId === card.id}
                          onChange={(e) => {
                            handleUpload(card.id, e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {dialog}
    </div>
  );
}
