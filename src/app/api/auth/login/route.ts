import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import {
  getSupabaseEnvIssues,
  getSupabasePublicEnv,
} from "@/lib/supabase/env";

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/login]", error);
    const detail =
      error instanceof Error ? error.message : "Erro ao entrar. Tente novamente.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
