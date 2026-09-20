import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/platform/require-super-admin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    subject?: string;
    message?: string;
    guest_name?: string;
    guest_email?: string;
  };

  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Informe assunto e mensagem." },
      { status: 400 }
    );
  }

  let userId: string | null = null;
  let guestName = body.guest_name?.trim() || null;
  let guestEmail = body.guest_email?.trim() || null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      guestName = profile?.full_name ?? guestName;
      guestEmail = profile?.email ?? guestEmail;
    }
  } catch {
    // visitante anônimo
  }

  if (!userId && (!guestName || !guestEmail)) {
    return NextResponse.json(
      { error: "Informe nome e e-mail para contato." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("support_messages").insert({
    user_id: userId,
    guest_name: guestName,
    guest_email: guestEmail,
    subject,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível enviar sua mensagem." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Mensagem enviada. Nossa equipe retornará em breve.",
  });
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const { admin } = auth;
  const { data, error } = await admin
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Erro ao carregar suporte." }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
