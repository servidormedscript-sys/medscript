/** URL canônica de produção (www). Usada quando NEXT_PUBLIC_SITE_URL não está definida. */
export const DEFAULT_SITE_URL = "https://www.medscript.com.br";

export function getCanonicalSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv?.startsWith("https://")) return fromEnv;
  return DEFAULT_SITE_URL;
}

/** URL real do app, inclusive http://localhost no desenvolvimento. */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return DEFAULT_SITE_URL;
}

/** Rotas públicas indexáveis (sitemap). */
export const PUBLIC_INDEXABLE_PATHS = [
  "/",
  "/cadastro",
  "/login",
  "/lgpd",
  "/termos-de-uso",
  "/termos-e-condicoes",
  "/cookies",
  "/cancelamento",
] as const;
