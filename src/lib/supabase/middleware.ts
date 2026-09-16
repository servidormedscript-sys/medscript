import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (!url.startsWith("https://") || !url.includes("supabase.co")) return null;

  return { url, anonKey };
}

function applyCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  cookiesToSet: CookieToSet[]
) {
  cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

  cookiesToSet.forEach(({ name, value, options }) => {
    if (options && Object.keys(options).length > 0) {
      supabaseResponse.cookies.set(
        name,
        value,
        options as Parameters<typeof supabaseResponse.cookies.set>[2]
      );
      return;
    }

    supabaseResponse.cookies.set(name, value);
  });
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          supabaseResponse = NextResponse.next({ request });
          applyCookies(request, supabaseResponse, cookiesToSet);
        },
      },
    });

    await supabase.auth.getUser();
  } catch (error) {
    console.error("[middleware] Falha ao atualizar sessão Supabase:", error);
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
