import { X } from "lucide-react";

// Sélecteur de catégorie au-dessus du champ de saisie.
// Optionnel : « sans branche » = nourrit le tronc général.

export const CategoryChips = ({ categories, selectedId, onSelect }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <div
            className="flex items-center gap-1.5 flex-wrap pb-2"
            data-testid="category-chips"
        >
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-sans-ui mr-1">
                Branche
            </span>
            {categories.map((cat) => {
                const isActive = cat.id === selectedId;
                return (
                    <button
                        key={cat.id}
                        data-testid={`chip-${cat.id}`}
                        onClick={() => onSelect(isActive ? null : cat.id)}
                        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans-ui transition-all border ${
                            isActive
                                ? "text-stone-50"
                                : "text-stone-700 hover:bg-stone-200/40"
                        }`}
                        style={{
                            backgroundColor: isActive ? cat.color : "transparent",
                            borderColor: isActive
                                ? cat.color
                                : "rgba(120, 113, 108, 0.25)",
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                                backgroundColor: isActive ? "#FAF9F6" : cat.color,
                            }}
                        />
                        {cat.label}
                        {isActive && <X className="w-3 h-3 ml-0.5 opacity-80" />}
                    </button>
                );
            })}
        </div>
    );
};
