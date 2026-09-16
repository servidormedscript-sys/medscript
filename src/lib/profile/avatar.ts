const AVATAR_BUCKET = "profile-avatars";

export function getProfileAvatarUrl(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${avatarUrl}`;
}

export function extractAvatarStoragePath(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return null;

  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = avatarUrl.indexOf(marker);
  if (index === -1) {
    return avatarUrl.includes("/") ? null : avatarUrl;
  }

  return avatarUrl.slice(index + marker.length);
}

export { AVATAR_BUCKET };
