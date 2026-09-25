import type { ProtocolCategory, ProtocolCategoryId } from "./types";

/** URLs antigas (subcategorias) → categoria atual no menu */
export const LEGACY_PROTOCOL_CATEGORY_IDS: Record<string, ProtocolCategoryId> = {
  neurologia: "clinica-aguda",
  respiratorio: "clinica-aguda",
  metabolico: "clinica-aguda",
  gastroenterologia: "clinica-aguda",
  obstetricia: "clinica-aguda",
  "saude-mental": "saude-mental-uti",
  "manejo-uti": "saude-mental-uti",
};

export function resolveProtocolCategoryId(
  categoryId: string
): ProtocolCategoryId | null {
  if (PROTOCOL_CATEGORIES.some((c) => c.id === categoryId)) {
    return categoryId as ProtocolCategoryId;
  }
  return LEGACY_PROTOCOL_CATEGORY_IDS[categoryId] ?? null;
}

export const PROTOCOL_CATEGORIES: ProtocolCategory[] = [
  {
    id: "emergencia",
    name: "Emergência / Reanimação",
    description: "PCR, choque, vias aéreas, toxinas e suporte imediato.",
    icon: "pulse",
    accentClass: "bg-red-50 text-red-700",
    borderClass: "border-red-200",
  },
  {
    id: "cardiologia",
    name: "Cardiologia",
    description: "Arritmias, SCA, edema agudo e instabilidade hemodinâmica.",
    icon: "heart",
    accentClass: "bg-ocean-50 text-ocean-700",
    borderClass: "border-ocean-200",
  },
  {
    id: "clinica-aguda",
    name: "Neurologia, Respiratório, Metabólico, GI e Obstetrícia",
    description:
      "AVC, dispneia, distúrbios metabólicos, HDA e emergências obstétricas.",
    icon: "brain",
    accentClass: "bg-purple-50 text-purple-700",
    borderClass: "border-purple-200",
  },
  {
    id: "saude-mental-uti",
    name: "Saúde Mental e Manejo de Sintomas / UTI",
    description: "Agitação, risco suicida, delirium e analgesia em UTI.",
    icon: "mind",
    accentClass: "bg-navy-50 text-navy-700",
    borderClass: "border-navy-100",
  },
  {
    id: "ferramentas",
    name: "Ferramentas",
    description:
      "Utilitários transversais — gotejamento, renal, gaso, escores (complemento a todos os protocolos).",
    icon: "tool",
    accentClass: "bg-ocean-50 text-ocean-700",
    borderClass: "border-ocean-200",
  },
];

export function getCategoryById(id: string) {
  const resolved = resolveProtocolCategoryId(id);
  if (!resolved) return undefined;
  return PROTOCOL_CATEGORIES.find((category) => category.id === resolved);
}
