const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Password should be at least 6 characters":
    "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula e número.",
  "Password should be at least 8 characters":
    "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula e número.",
  WeakPasswordError:
    "Senha fraca. Use no mínimo 8 caracteres, com maiúscula, minúscula e número.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Unable to validate email address: invalid format":
    "Formato de e-mail inválido.",
  "Email rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "For security purposes, you can only request this once every 60 seconds":
    "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  "Error sending recovery email":
    "Falha ao enviar o e-mail. Verifique o SMTP no Supabase (Authentication → SMTP) ou aguarde e tente de novo.",
  "Error sending confirmation email":
    "Falha ao enviar o e-mail de confirmação. Verifique o SMTP no Supabase.",
  "535":
    "Falha de autenticação SMTP. Confira usuário/senha (API key) do Resend no Supabase.",
};

export function translateAuthError(message: string) {
  const trimmed = message.trim();
  if (AUTH_ERROR_MAP[trimmed]) return AUTH_ERROR_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (lower.includes("redirect") && lower.includes("not allowed")) {
    return "URL de retorno não autorizada. Adicione https://www.medscript.com.br/auth/callback no Supabase (Authentication → URL Configuration).";
  }
  if (lower.includes("error sending") || lower.includes("smtp")) {
    return "Falha ao enviar e-mail. Revise SMTP em Supabase → Authentication → SMTP (host, API key Resend, remetente @medscript.com.br).";
  }

  return trimmed || "Não foi possível concluir a operação. Tente novamente.";
}
