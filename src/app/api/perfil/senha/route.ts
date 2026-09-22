import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { validateAccountPassword } from "@/lib/auth/password-policy";
import { translateAuthError } from "@/lib/auth/translate-auth-error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await getSessionWithAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Preencha todos os campos de senha." },
      { status: 400 },
    );
  }

  const passwordError = validateAccountPassword(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "A confirmação da nova senha não confere." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.user!.email ?? auth.profile.email,
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json(
      { error: translateAuthError(updateError.message) },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
