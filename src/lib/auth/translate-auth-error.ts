const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Password should be at least 6 characters":
    "A senha deve ter no mínimo 6 caracteres.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Unable to validate email address: invalid format":
    "Formato de e-mail inválido.",
  "Email rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "For security purposes, you can only request this once every 60 seconds":
    "Por segurança, aguarde 60 segundos antes de tentar novamente.",
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

  return trimmed || "Não foi possível concluir a operação. Tente novamente.";
}
