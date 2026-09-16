import type { ProtocolCategory } from "./types";

export const PROTOCOL_CATEGORIES: ProtocolCategory[] = [
  {
    id: "emergencia",
    name: "Emergência / Reanimação",
    description: "PCR, choque, vias aéreas e estabilização imediata.",
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
    id: "neurologia",
    name: "Neurologia",
    description: "AVC, convulsões e emergências neurológicas.",
    icon: "brain",
    accentClass: "bg-purple-50 text-purple-700",
    borderClass: "border-purple-200",
  },
  {
    id: "respiratorio",
    name: "Respiratório",
    description: "Asma, DPOC e insuficiência respiratória aguda.",
    icon: "lungs",
    accentClass: "bg-emerald-50 text-emerald-700",
    borderClass: "border-emerald-200",
  },
  {
    id: "metabolico",
    name: "Metabólico",
    description: "Distúrbios glicêmicos, eletrolíticos e ácido-base.",
    icon: "droplet",
    accentClass: "bg-green-50 text-green-700",
    borderClass: "border-green-200",
  },
  {
    id: "gastroenterologia",
    name: "Gastroenterologia",
    description: "Hemorragias digestivas e abdome agudo.",
    icon: "stomach",
    accentClass: "bg-amber-50 text-amber-700",
    borderClass: "border-amber-200",
  },
  {
    id: "obstetricia",
    name: "Obstetrícia",
    description: "Emergências obstétricas e hipertensão gestacional.",
    icon: "baby",
    accentClass: "bg-fuchsia-50 text-fuchsia-700",
    borderClass: "border-fuchsia-200",
  },
  {
    id: "saude-mental",
    name: "Saúde Mental",
    description: "Agitação, intoxicações e crises psiquiátricas.",
    icon: "mind",
    accentClass: "bg-navy-50 text-navy-700",
    borderClass: "border-navy-100",
  },
  {
    id: "manejo-uti",
    name: "Manejo de Sintomas / UTI",
    description: "Sedação, analgesia e controle de sintomas em UTI.",
    icon: "bed",
    accentClass: "bg-teal-50 text-teal-700",
    borderClass: "border-teal-200",
  },
  {
    id: "ferramentas",
    name: "Ferramentas",
    description: "Escores clínicos e calculadoras auxiliares.",
    icon: "tool",
    accentClass: "bg-ocean-50 text-ocean-700",
    borderClass: "border-ocean-200",
  },
];

export function getCategoryById(id: string) {
  return PROTOCOL_CATEGORIES.find((category) => category.id === id);
}
