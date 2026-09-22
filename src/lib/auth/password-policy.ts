export const ACCOUNT_PASSWORD_MIN_LENGTH = 8;

/** Texto curto para labels / hints nos formulários. */
export const ACCOUNT_PASSWORD_HINT =
  "Mínimo 8 caracteres, com letra maiúscula, minúscula e número.";

export function validateAccountPassword(password: string): string | null {
  if (!password || password.length < ACCOUNT_PASSWORD_MIN_LENGTH) {
    return `A senha deve ter no mínimo ${ACCOUNT_PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password)) {
    return "A senha deve incluir pelo menos uma letra minúscula.";
  }
  if (!/[A-Z]/.test(password)) {
    return "A senha deve incluir pelo menos uma letra maiúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "A senha deve incluir pelo menos um número.";
  }
  return null;
}
