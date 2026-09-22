import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/platform/require-super-admin";
import { validateAccountPassword } from "@/lib/auth/password-policy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    action?: string;
    email?: string;
    password?: string;
    days?: number;
    complimentary?: boolean;
    complimentary_note?: string;
    account_status?: "active" | "blocked" | "deactivated";
  };

  const { admin } = auth;

  const { data: profile } = await admin.from("profiles").select("*").eq("id", id).single();
  if (!profile) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (profile.platform_role === "super_admin") {
    return NextResponse.json(
      { error: "Não é permitido alterar outro admin do site por aqui." },
      { status: 400 }
    );
  }

  switch (body.action) {
    case "update_email": {
      if (!body.email?.trim()) {
        return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
      }
      const { error } = await admin.auth.admin.updateUserById(id, {
        email: body.email.trim(),
      });
      if (error) {
        return NextResponse.json({ error: translateAdminError(error.message) }, { status: 400 });
      }
      await admin.from("profiles").update({ email: body.email.trim() }).eq("id", id);
      break;
    }
    case "update_password": {
      if (!body.password) {
        return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
      }
      const passwordError = validateAccountPassword(body.password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }
      const { error } = await admin.auth.admin.updateUserById(id, {
        password: body.password,
      });
      if (error) {
        return NextResponse.json({ error: translateAdminError(error.message) }, { status: 400 });
      }
      break;
    }
    case "add_days": {
      const days = body.days ?? 30;
      const { error } = await admin.rpc("add_subscription_days", {
        p_user_id: profile.role === "admin" ? id : profile.parent_admin_id,
        p_days: days,
      });
      if (error) {
        return NextResponse.json({ error: "Erro ao adicionar dias ao plano." }, { status: 500 });
      }
      break;
    }
    case "complimentary_access": {
      const billingId = profile.role === "admin" ? id : profile.parent_admin_id;
      if (!billingId) {
        return NextResponse.json({ error: "Usuário sem clínica vinculada." }, { status: 400 });
      }
      await admin
        .from("subscriptions")
        .update({
          complimentary_access: Boolean(body.complimentary),
          complimentary_note: body.complimentary_note?.trim() || null,
          ...(body.complimentary ? { status: "active" as const } : {}),
        })
        .eq("user_id", billingId);
      break;
    }
    case "set_status": {
      if (!body.account_status) {
        return NextResponse.json({ error: "Status inválido." }, { status: 400 });
      }
      await admin
        .from("profiles")
        .update({
          account_status: body.account_status,
          deactivated_at:
            body.account_status === "deactivated" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      break;
    }
    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const { admin } = auth;

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (profile.platform_role === "super_admin") {
    return NextResponse.json({ error: "Não é possível excluir admin do site." }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: "Erro ao excluir conta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function translateAdminError(message: string) {
  if (message.toLowerCase().includes("already been registered")) {
    return "Este e-mail já está em uso.";
  }
  return message;
}
