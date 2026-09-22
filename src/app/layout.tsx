import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MEDSCRIPT_LOGO_PATH } from "@/lib/branding";
import { rootMetadata } from "@/lib/seo/default-metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  ...rootMetadata,
  icons: {
    icon: MEDSCRIPT_LOGO_PATH,
    apple: MEDSCRIPT_LOGO_PATH,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
