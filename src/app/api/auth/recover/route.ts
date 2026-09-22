import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import {
  getSupabaseEnvIssues,
  getSupabasePublicEnv,
} from "@/lib/supabase/env";
import { DEFAULT_SITE_URL } from "@/lib/seo/site";

function resolveSiteUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv?.startsWith("https://") && !fromEnv.includes("localhost")) {
    return fromEnv;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return DEFAULT_SITE_URL;
}

export async function POST(request: Request) {
  const env = getSupabasePublicEnv();
  if (!env) {
    const issues = getSupabaseEnvIssues();
    return NextResponse.json(
      {
        error:
          issues.length > 0
            ? `Configure na Vercel: ${issues.join(", ")}. Depois faça redeploy.`
            : "Supabase não configurado no servidor.",
      },
      { status: 500 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
  }

  const siteUrl = resolveSiteUrl(request);
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`;

  try {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[auth/recover]", error.message, { redirectTo, code: error.code });
      return NextResponse.json(
        { error: translateAuthError(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth/recover]", err);
    const detail = err instanceof Error ? err.message : "Erro ao enviar e-mail.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
