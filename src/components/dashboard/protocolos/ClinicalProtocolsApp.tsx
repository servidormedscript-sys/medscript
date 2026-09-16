"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PROTOCOL_CATEGORIES } from "@/lib/clinical/protocols/categories";
import {
  CLINICAL_PROTOCOLS,
  getCategoryProtocolCount,
  getProtocolsByCategory,
  searchProtocols,
} from "@/lib/clinical/protocols/catalog";
import { CategoryIcon } from "@/lib/clinical/protocols/icons";
import ProtocolCategoryGrid from "./ProtocolCategoryGrid";
import ProtocolList from "./ProtocolList";
import ProtocolDetail from "./ProtocolDetail";

type View =
  | { type: "home" }
  | { type: "category"; categoryId: string }
  | { type: "protocol"; categoryId: string; protocolId: string };

export default function ClinicalProtocolsApp() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>({ type: "home" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const categoryId = searchParams.get("category");
    const protocolId = searchParams.get("protocol");

    if (categoryId && protocolId) {
      const protocol = CLINICAL_PROTOCOLS.find(
        (item) => item.id === protocolId && item.categoryId === categoryId
      );
      if (protocol) {
        setView({ type: "protocol", categoryId, protocolId });
      }
    } else if (categoryId) {
      const category = PROTOCOL_CATEGORIES.find((item) => item.id === categoryId);
      if (category) {
        setView({ type: "category", categoryId });
      }
    }
  }, [searchParams]);

  const searchResults = useMemo(() => searchProtocols(search), [search]);
  const isSearching = search.trim().length > 0;

  const currentCategory = useMemo(() => {
    if (view.type === "home") return null;
    return PROTOCOL_CATEGORIES.find((c) => c.id === view.categoryId) ?? null;
  }, [view]);

  const currentProtocol = useMemo(() => {
    if (view.type !== "protocol") return null;
    return CLINICAL_PROTOCOLS.find((p) => p.id === view.protocolId) ?? null;
  }, [view]);

  function openCategory(categoryId: string) {
    setSearch("");
    setView({ type: "category", categoryId });
  }

  function openProtocol(categoryId: string, protocolId: string) {
    setView({ type: "protocol", categoryId, protocolId });
  }

  function goHome() {
    setView({ type: "home" });
  }

  function goCategory() {
    if (view.type === "protocol") {
      setView({ type: "category", categoryId: view.categoryId });
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-navy-800/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3-3" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.trim()) setView({ type: "home" });
          }}
          placeholder="Buscar por sintoma ou protocolo..."
          className="w-full rounded-lg border border-navy-900/12 bg-white py-3 pr-4 pl-11 text-sm text-navy-950 outline-none focus:border-navy-700"
        />
      </div>

      {view.type !== "home" && (
        <nav className="flex items-center gap-2 text-sm text-navy-800/60">
          <button
            type="button"
            onClick={goHome}
            className="transition-colors hover:text-navy-950"
          >
            Protocolos
          </button>
          {currentCategory && (
            <>
              <span>/</span>
              {view.type === "protocol" ? (
                <button
                  type="button"
                  onClick={goCategory}
                  className="transition-colors hover:text-navy-950"
                >
                  {currentCategory.name}
                </button>
              ) : (
                <span className="text-navy-950">{currentCategory.name}</span>
              )}
            </>
          )}
          {currentProtocol && (
            <>
              <span>/</span>
              <span className="text-navy-950">{currentProtocol.name}</span>
            </>
          )}
        </nav>
      )}

      {isSearching && (
        <ProtocolList
          title={`${searchResults.length} resultado(s)`}
          protocols={searchResults}
          onSelect={(protocol) =>
            openProtocol(protocol.categoryId, protocol.id)
          }
        />
      )}

      {!isSearching && view.type === "home" && (
        <ProtocolCategoryGrid
          categories={PROTOCOL_CATEGORIES}
          getCount={getCategoryProtocolCount}
          onSelect={openCategory}
        />
      )}

      {!isSearching && view.type === "category" && currentCategory && (
        <ProtocolList
          title={currentCategory.name}
          description={currentCategory.description}
          protocols={getProtocolsByCategory(currentCategory.id)}
          onSelect={(protocol) =>
            openProtocol(protocol.categoryId, protocol.id)
          }
        />
      )}

      {!isSearching && view.type === "protocol" && currentProtocol && (
        <ProtocolDetail protocol={currentProtocol} />
      )}
    </div>
  );
}
