import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const response = await updateSession(request);
    response.headers.delete("Access-Control-Allow-Origin");
    return response;
  } catch (error) {
    console.error("[middleware] Erro inesperado:", error);
    const response = NextResponse.next({ request });
    response.headers.delete("Access-Control-Allow-Origin");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
