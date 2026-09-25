import type { MetadataRoute } from "next";
import { MEDSCRIPT_LOGO_PATH } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MEDScript — Plantão e emergência",
    short_name: "MEDScript",
    description:
      "Protocolos clínicos, prontuário, Kanban de pacientes e gestão de plantão.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#212e4e",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: MEDSCRIPT_LOGO_PATH,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: MEDSCRIPT_LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: MEDSCRIPT_LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
