"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#vantagens", label: "Recursos" },
  { href: "#precos", label: "Planos" },
];

export default function Header() {
  const [active, setActive] = useState("#inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-900/5 bg-white/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
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

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-full border border-ocean-800 px-5 py-2 text-sm font-medium text-ocean-800 transition-colors hover:bg-ocean-50"
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

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-navy-900/12 text-navy-950 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-navy-900/8 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  setActive(link.href);
                  setMenuOpen(false);
                }}
                className="rounded-lg px-3 py-3 text-sm font-medium text-navy-900 hover:bg-navy-50"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-navy-900/8 pt-4">
            <a
              href="/login"
              className="rounded-full border border-ocean-800 px-4 py-2.5 text-center text-sm font-medium text-ocean-800"
            >
              Entrar
            </a>
            <a
              href="/cadastro"
              className="rounded-full bg-ocean-800 px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Criar conta
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
