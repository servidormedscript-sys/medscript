import type { Metadata } from "next";
import { MEDSCRIPT_LOGO_PATH } from "@/lib/branding";
import { getCanonicalSiteUrl } from "@/lib/seo/site";

const siteUrl = getCanonicalSiteUrl();

const defaultTitle = "MEDScript — Gestão clínica para plantão e emergência";
const defaultDescription =
  "Prontuário, T0, Kanban de pacientes, protocolos clínicos e gestão de equipe. Plataforma para plantonistas e clínicas, com foco em LGPD.";

export function buildDefaultMetadata(overrides?: Metadata): Metadata {
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  const base: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: "%s — MEDScript",
    },
    description: defaultDescription,
    applicationName: "MEDScript",
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: siteUrl,
      siteName: "MEDScript",
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: MEDSCRIPT_LOGO_PATH,
          alt: "MEDScript",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: defaultTitle,
      description: defaultDescription,
      images: [MEDSCRIPT_LOGO_PATH],
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  };

  return { ...base, ...overrides };
}

export const rootMetadata = buildDefaultMetadata();
