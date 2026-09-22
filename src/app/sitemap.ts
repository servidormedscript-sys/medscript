import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl, PUBLIC_INDEXABLE_PATHS } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalSiteUrl();
  const lastModified = new Date();

  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/cadastro" ? 0.9 : 0.5,
  }));
}
