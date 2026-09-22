import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/platform/",
          "/api/",
          "/auth/",
          "/redefinir-senha",
          "/recuperar-senha",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
