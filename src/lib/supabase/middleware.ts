import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

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
  const env = getSupabasePublicEnv();
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
