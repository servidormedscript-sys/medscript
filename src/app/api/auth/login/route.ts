import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  getSupabaseEnvIssues,
  getSupabasePublicEnv,
} from "@/lib/supabase/env";
import { assertAccountCanLogin } from "@/lib/platform/account-access";
import type { Profile } from "@/lib/types/profile";

export async function POST(request: Request) {
  const env = getSupabasePublicEnv();
  if (!env) {
    const issues = getSupabaseEnvIssues();
    return NextResponse.json(
      {
        error:
          issues.length > 0
            ? `Configure na Vercel: ${issues.join(", ")}. Depois faça redeploy.`
            : "Supabase não configurado no servidor. Verifique as variáveis na Vercel.",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe e-mail e senha." },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: translateAuthError(error.message) },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json({ error: "Erro ao entrar. Tente novamente." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    const access = await assertAccountCanLogin(profile as Profile);
    if (!access.ok) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: access.message }, { status: 403 });
    }

    const redirectTo = "/dashboard";

    return NextResponse.json({ ok: true, redirectTo });
  } catch (error) {
    console.error("[auth/login]", error);
    const detail =
      error instanceof Error ? error.message : "Erro ao entrar. Tente novamente.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
