"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#vantagens", label: "Recursos" },
  { href: "#precos", label: "Planos" },
];

export default function Header() {
  const [active, setActive] = useState("#inicio");

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <BrandLogo size="header" priority />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setActive(link.href)}
              className={`text-[15px] font-medium transition-colors ${
                active === link.href
                  ? "text-ocean-800 underline decoration-2 underline-offset-8"
                  : "text-navy-800/70 hover:text-ocean-800"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden rounded-full border border-ocean-800 px-5 py-2 text-sm font-medium text-ocean-800 transition-colors hover:bg-ocean-50 sm:inline-block"
          >
            Entrar
          </a>
          <a
            href="/cadastro"
            className="rounded-full bg-ocean-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-ocean-700"
          >
            Criar conta
          </a>
        </div>
      </div>
    </header>
  );
}
