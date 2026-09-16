export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (!url.startsWith("https://") || !url.includes("supabase.co")) return null;

  return { url, anonKey };
}

export function getSiteUrl(fallback?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  return fallback?.replace(/\/$/, "") ?? "";
}
