import type { ProtocolCategory } from "@/lib/clinical/protocols/types";
import { CategoryIcon } from "@/lib/clinical/protocols/icons";

type ProtocolCategoryGridProps = {
  categories: ProtocolCategory[];
  getCount: (categoryId: string) => number;
  onSelect: (categoryId: string) => void;
};

export default function ProtocolCategoryGrid({
  categories,
  getCount,
  onSelect,
}: ProtocolCategoryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category) => {
        const count = getCount(category.id);
        const label = count === 1 ? "1 protocolo" : `${count} protocolos`;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`rounded-lg border bg-white p-5 text-left transition-all hover:shadow-sm ${category.borderClass} hover:border-navy-900/20`}
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md border ${category.accentClass} ${category.borderClass}`}
            >
              <CategoryIcon icon={category.icon} className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-navy-950">{category.name}</h3>
            <p className="mt-1 text-xs text-navy-800/55">{label}</p>
          </button>
        );
      })}
    </div>
  );
}
