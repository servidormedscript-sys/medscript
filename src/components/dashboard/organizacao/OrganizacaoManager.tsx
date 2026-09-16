"use client";

import { useCallback, useEffect, useState } from "react";
import type { Organization, Profile, UserType } from "@/lib/types/profile";

type TeamWithMembers = Organization & {
  organization_members: {
    id: string;
    profile_id: string;
    profile: Pick<Profile, "id" | "full_name" | "email" | "user_type"> | null;
  }[];
};

const userTypeLabels: Record<UserType, string> = {
  plantonista: "Plantonista",
  estudante: "Estudante",
};

type OrganizacaoManagerProps = {
  isAdmin: boolean;
};

export default function OrganizacaoManager({ isAdmin }: OrganizacaoManagerProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "equipes">("usuarios");
  const [users, setUsers] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    user_type: "plantonista" as UserType,
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([
        fetch("/api/organizacao/usuarios"),
        fetch("/api/organizacao/equipes"),
      ]);

      const usersData = await usersRes.json();
      const teamsData = await teamsRes.json();

      if (usersRes.ok) setUsers(usersData.users ?? []);
      if (teamsRes.ok) setTeams(teamsData.teams ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/organizacao/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao criar usuário." });
      return;
    }

    setMessage({ type: "success", text: "Usuário criado com sucesso." });
    setUserForm({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      user_type: "plantonista",
    });
    loadData();
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch("/api/organizacao/equipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamForm),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao criar equipe." });
      return;
    }

    setMessage({ type: "success", text: "Equipe criada com sucesso." });
    setTeamForm({ name: "", description: "" });
    loadData();
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!selectedTeamId || !selectedMemberId) {
      setMessage({ type: "error", text: "Selecione a equipe e o usuário." });
      return;
    }

    const res = await fetch(
      `/api/organizacao/equipes/${selectedTeamId}/membros`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: selectedMemberId }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao adicionar membro." });
      return;
    }

    setMessage({ type: "success", text: "Membro adicionado à equipe." });
    setSelectedMemberId("");
    loadData();
  }

  async function handleRemoveMember(teamId: string, profileId: string) {
    setMessage(null);

    const res = await fetch(
      `/api/organizacao/equipes/${teamId}/membros?profile_id=${profileId}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erro ao remover membro." });
      return;
    }

    setMessage({ type: "success", text: "Membro removido da equipe." });
    loadData();
  }

  const inputClass =
    "w-full rounded-md border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-950 outline-none focus:border-navy-700";

  return (
    <div>
      {!isAdmin ? (
        <div className="mb-6 rounded-xl border border-ocean-100 bg-ocean-50/70 px-4 py-3 text-sm text-ocean-900">
          Modo visualização: você pode consultar os usuários e equipes da clínica.
          Apenas o administrador pode cadastrar ou alterar dados.
        </div>
      ) : null}

      <div className="mb-6 flex gap-1 border-b border-navy-900/8">
        <button
          type="button"
          onClick={() => setActiveTab("usuarios")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "usuarios"
              ? "border-b-2 border-navy-900 text-navy-950"
              : "text-navy-800/50 hover:text-navy-800"
          }`}
        >
          Sub-usuários
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("equipes")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "equipes"
              ? "border-b-2 border-navy-900 text-navy-950"
              : "text-navy-800/50 hover:text-navy-800"
          }`}
        >
          Equipes
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-navy-800/60">Carregando...</p>
      ) : activeTab === "usuarios" ? (
        <div
          className={
            isAdmin ? "grid gap-8 lg:grid-cols-2" : "max-w-3xl"
          }
        >
          {isAdmin ? (
          <div className="rounded-lg border border-navy-900/8 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-navy-950">
              Novo sub-usuário
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, full_name: e.target.value })
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
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm({ ...userForm, phone: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy-800/70">
                  Tipo
                </label>
                <select
                  value={userForm.user_type}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      user_type: e.target.value as UserType,
                    })
                  }
                  className={inputClass}
                >
                  <option value="plantonista">Plantonista</option>
                  <option value="estudante">Estudante</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
              >
                Criar usuário
              </button>
            </form>
          </div>
          ) : null}

          <div className="rounded-lg border border-navy-900/8 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-navy-950">
              {isAdmin ? "Usuários cadastrados" : "Usuários da clínica"}
            </h2>
            {users.length === 0 ? (
              <p className="text-sm text-navy-800/60">
                Nenhum sub-usuário cadastrado.
              </p>
            ) : (
              <ul className="divide-y divide-navy-900/8">
                {users.map((user) => (
                  <li key={user.id} className="py-4 first:pt-0 last:pb-0">
                    <p className="font-medium text-navy-950">
                      {user.full_name ?? "Sem nome"}
                    </p>
                    <p className="text-sm text-navy-800/65">{user.email}</p>
                    <div className="mt-1 flex gap-3 text-xs text-navy-800/50">
                      {user.user_type && (
                        <span>{userTypeLabels[user.user_type]}</span>
                      )}
                      {user.phone && <span>{user.phone}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {isAdmin ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-navy-900/8 bg-white p-6">
              <h2 className="mb-4 text-lg font-medium text-navy-950">
                Nova equipe
              </h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy-800/70">
                    Nome da equipe
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Equipe de Cirurgia"
                    value={teamForm.name}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, name: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy-800/70">
                    Descrição (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={teamForm.description}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, description: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                >
                  Criar equipe
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-navy-900/8 bg-white p-6">
              <h2 className="mb-4 text-lg font-medium text-navy-950">
                Adicionar membro à equipe
              </h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy-800/70">
                    Equipe
                  </label>
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione uma equipe</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy-800/70">
                    Usuário
                  </label>
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name ?? user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={users.length === 0 || teams.length === 0}
                  className="w-full rounded-md bg-navy-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Adicionar à equipe
                </button>
              </form>
            </div>
          </div>
          ) : null}

          <div className="rounded-lg border border-navy-900/8 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-navy-950">
              {isAdmin ? "Equipes e membros" : "Equipes da clínica"}
            </h2>
            {teams.length === 0 ? (
              <p className="text-sm text-navy-800/60">
                Nenhuma equipe cadastrada.
              </p>
            ) : (
              <div className="space-y-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-md border border-navy-900/8 p-4"
                  >
                    <h3 className="font-medium text-navy-950">{team.name}</h3>
                    {team.description && (
                      <p className="mt-1 text-sm text-navy-800/60">
                        {team.description}
                      </p>
                    )}

                    {team.organization_members.length === 0 ? (
                      <p className="mt-3 text-sm text-navy-800/50">
                        Nenhum membro nesta equipe.
                      </p>
                    ) : (
                      <ul className="mt-3 divide-y divide-navy-900/8">
                        {team.organization_members.map((member) => (
                          <li
                            key={member.id}
                            className={`flex items-center py-2.5 first:pt-0 ${
                              isAdmin ? "justify-between" : ""
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-navy-950">
                                {member.profile?.full_name ?? "Sem nome"}
                              </p>
                              <p className="text-xs text-navy-800/50">
                                {member.profile?.email}
                                {member.profile?.user_type &&
                                  ` · ${userTypeLabels[member.profile.user_type]}`}
                              </p>
                            </div>
                            {isAdmin ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(team.id, member.profile_id)
                              }
                              className="text-xs text-red-700 transition-colors hover:text-red-900"
                            >
                              Remover
                            </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
