function readEnv(name: string) {
  return process.env[name]?.trim() || null;
}

export function getSupabasePublicEnv() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY");

  if (!url || !anonKey) return null;
  if (!url.startsWith("https://") || !url.includes("supabase.co")) return null;

  return { url, anonKey };
}

export function getSupabaseEnvIssues() {
  const issues: string[] = [];

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY");

  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL");
  } else if (!url.startsWith("https://") || !url.includes("supabase.co")) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL (valor inválido)");
  }

  if (!anonKey) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return issues;
}

/** Prefer fallback when env aponta para localhost em produção. */
export function getSiteUrl(fallback?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (
    siteUrl?.startsWith("https://") &&
    !siteUrl.includes("localhost") &&
    !siteUrl.includes("127.0.0.1")
  ) {
    return siteUrl;
  }
  return fallback?.replace(/\/$/, "") ?? siteUrl ?? "";
}
