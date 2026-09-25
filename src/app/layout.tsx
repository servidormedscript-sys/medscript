import type { Metadata, Viewport } from "next";
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
  appleWebApp: {
    capable: true,
    title: "MEDScript",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#212e4e" },
    { media: "(prefers-color-scheme: dark)", color: "#161e33" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased overscroll-y-none">{children}</body>
    </html>
  );
}
