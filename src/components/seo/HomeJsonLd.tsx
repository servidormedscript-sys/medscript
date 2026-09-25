import { getCanonicalSiteUrl } from "@/lib/seo/site";

export default function HomeJsonLd() {
  const siteUrl = getCanonicalSiteUrl();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MEDScript",
    url: siteUrl,
    logo: `${siteUrl}/imagens_publicas/novalogopreta.png`,
    sameAs: ["https://www.instagram.com/medscript.app/"],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MEDScript",
    url: siteUrl,
    inLanguage: "pt-BR",
    description:
      "Gestão clínica para plantão, prontuário e protocolos assistenciais.",
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MEDScript",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Plano mensal",
        price: "29.90",
        priceCurrency: "BRL",
        description: "30 dias de acesso por clínica, após 14 dias de avaliação.",
      },
      {
        "@type": "Offer",
        name: "Plano anual",
        price: "249.00",
        priceCurrency: "BRL",
        description: "365 dias de acesso por clínica.",
      },
    ],
    url: siteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
