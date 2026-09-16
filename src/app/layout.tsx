import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MEDSCRIPT_LOGO_PATH } from "@/lib/branding";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEDScript — Gestão clínica",
  description:
    "Plataforma para prontuários, agendamentos e prescrições digitais. Desenvolvida para clínicas e consultórios médicos.",
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
