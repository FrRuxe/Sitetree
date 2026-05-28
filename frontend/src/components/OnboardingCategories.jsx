import { useState } from "react";
import { Check, Plus, X, Sparkles } from "lucide-react";
import {
    DEFAULT_CATEGORIES,
    CATEGORY_PALETTE,
    MIN_CATEGORIES,
    MAX_CATEGORIES,
    makeCategoryStat,
} from "../lib/categories";

export const OnboardingCategories = ({
    initialCategories,
    onSave,
    onClose,
    isFirstTime = true,
}) => {
    // État local : liste éditable de { id, label, color, selected }
    const [items, setItems] = useState(() => {
        if (initialCategories && initialCategories.length > 0) {
            return initialCategories.map((c) => ({
                id: c.id,
                label: c.label,
                color: c.color,
                selected: true,
                custom: !DEFAULT_CATEGORIES.find((d) => d.id === c.id),
                isInitial: c.isInitial !== false,
                existingStats: c,
            }));
        }
        return DEFAULT_CATEGORIES.map((c) => ({
            id: c.id,
            label: c.label,
            color: c.color,
            selected: c.preselected,
            custom: false,
            isInitial: true,
        }));
    });

    const [newLabel, setNewLabel] = useState("");

    const selectedCount = items.filter((i) => i.selected).length;

    const toggle = (id) => {
        setItems((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;
                // Si on veut désélectionner mais qu'on est déjà au minimum, on bloque
                if (it.selected && selectedCount <= MIN_CATEGORIES) return it;
                // Si on veut sélectionner mais qu'on est au max, on bloque
                if (!it.selected && selectedCount >= MAX_CATEGORIES) return it;
                return { ...it, selected: !it.selected };
            })
        );
    };

    const rename = (id, label) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, label } : it)));
    };

    const removeCustom = (id) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const addCustom = () => {
        const label = newLabel.trim();
        if (!label) return;
        if (items.length >= 10) return; // garde-fou
        const used = items.map((i) => i.color);
        const nextColor =
            CATEGORY_PALETTE.find((c) => !used.includes(c)) ||
            CATEGORY_PALETTE[items.length % CATEGORY_PALETTE.length];
        const id = `custom-${Date.now()}`;
        const canSelect = selectedCount < MAX_CATEGORIES;
        setItems((prev) => [
            ...prev,
            { id, label, color: nextColor, selected: canSelect, custom: true },
        ]);
        setNewLabel("");
    };

    const handleSave = () => {
        const selected = items.filter((i) => i.selected);
        if (selected.length < MIN_CATEGORIES) return;
        // Mappe vers stats : on conserve les stats existantes si on a un id qui matche
        const result = selected.map((it) => {
            const existing = (initialCategories || []).find((c) => c.id === it.id);
            if (existing) {
                return { ...existing, label: it.label, color: it.color };
            }
            return makeCategoryStat(it);
        });
        onSave(result);
    };

    const canSave = selectedCount >= MIN_CATEGORIES;
    const canAddMore = selectedCount < MAX_CATEGORIES;

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-8 bg-stone-900/30 backdrop-blur-sm animate-soft-in"
            data-testid="onboarding-modal"
        >
            <div
                className="relative w-full max-w-xl max-h-full md:max-h-[92vh] overflow-y-auto scroll-soft rounded-none md:rounded-3xl border border-stone-200 shadow-sm"
                style={{ backgroundColor: "#FAF9F6" }}
            >
                {!isFirstTime && (
                    <button
                        onClick={onClose}
                        data-testid="onboarding-close"
                        className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-stone-500 hover:bg-stone-200/50"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="px-6 md:px-8 pt-8 pb-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: "rgba(143, 151, 121, 0.18)" }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: "#8F9779" }} />
                    </div>
                    <h2 className="font-serif-reading text-2xl md:text-3xl text-stone-800">
                        {isFirstTime
                            ? "Quelles branches comptent pour toi ?"
                            : "Tes branches"}
                    </h2>
                    <p className="text-sm text-stone-600 mt-2 font-sans-ui leading-relaxed">
                        Chaque branche est un domaine de ta vie. Quand tu y déposes une
                        pensée, la branche correspondante grandit. Tu peux changer ton choix
                        à tout moment. Choisis de {MIN_CATEGORIES} à {MAX_CATEGORIES}{" "}
                        branches.
                    </p>
                </div>

                <div className="px-6 md:px-8 pb-2 space-y-2" data-testid="categories-list">
                    {items.map((it) => {
                        const isSelected = it.selected;
                        const disabledAdd = !isSelected && !canAddMore;
                        return (
                            <div
                                key={it.id}
                                data-testid={`category-row-${it.id}`}
                                className={`flex items-center gap-3 rounded-2xl p-3 transition-colors border ${
                                    isSelected
                                        ? "border-stone-300"
                                        : "border-stone-200/60"
                                }`}
                                style={{
                                    backgroundColor: isSelected
                                        ? `${it.color}14`
                                        : "transparent",
                                }}
                            >
                                <button
                                    onClick={() => toggle(it.id)}
                                    data-testid={`category-toggle-${it.id}`}
                                    disabled={disabledAdd}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        disabledAdd ? "opacity-40 cursor-not-allowed" : ""
                                    }`}
                                    style={{
                                        borderColor: isSelected ? it.color : "#D6CFC2",
                                        backgroundColor: isSelected ? it.color : "transparent",
                                    }}
                                    aria-pressed={isSelected}
                                    aria-label={`Activer ${it.label}`}
                                >
                                    {isSelected && (
                                        <Check className="w-3.5 h-3.5" color="#FAF9F6" />
                                    )}
                                </button>
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: it.color }}
                                />
                                <input
                                    value={it.label}
                                    onChange={(e) => rename(it.id, e.target.value)}
                                    data-testid={`category-input-${it.id}`}
                                    className="flex-1 bg-transparent outline-none text-[15px] text-stone-800 font-sans-ui placeholder:text-stone-400"
                                    placeholder="Nom de la branche"
                                    maxLength={20}
                                />
                                {it.custom && (
                                    <button
                                        onClick={() => removeCustom(it.id)}
                                        data-testid={`category-remove-${it.id}`}
                                        className="p-1 text-stone-400 hover:text-stone-700"
                                        aria-label="Supprimer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Ajout d'une catégorie personnalisée */}
                <div className="px-6 md:px-8 pt-2 pb-4">
                    <div className="flex items-center gap-2">
                        <input
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustom();
                                }
                            }}
                            data-testid="category-new-input"
                            placeholder="Ajouter une branche…"
                            maxLength={20}
                            className="flex-1 bg-transparent border border-stone-200 rounded-2xl px-4 py-2.5 outline-none text-sm text-stone-800 font-sans-ui placeholder:text-stone-400 focus:border-stone-300"
                        />
                        <button
                            onClick={addCustom}
                            disabled={!newLabel.trim() || items.length >= 10}
                            data-testid="category-add-btn"
                            className="px-3 py-2.5 rounded-2xl text-sm font-sans-ui flex items-center gap-1.5 transition-opacity disabled:opacity-40"
                            style={{ backgroundColor: "#8F9779", color: "#FAF9F6" }}
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter
                        </button>
                    </div>
                </div>

                {/* Compteur et action */}
                <div
                    className="sticky bottom-0 px-6 md:px-8 py-4 border-t border-stone-200/70 flex items-center justify-between"
                    style={{ backgroundColor: "#FAF9F6" }}
                >
                    <p className="text-xs text-stone-500 font-sans-ui">
                        <span
                            data-testid="category-counter"
                            style={{
                                color: canSave ? "#6B7361" : "#9F3645",
                                fontWeight: 500,
                            }}
                        >
                            {selectedCount}
                        </span>{" "}
                        / {MAX_CATEGORIES} sélectionnée{selectedCount > 1 ? "s" : ""}{" "}
                        {!canSave && (
                            <span className="italic">— minimum {MIN_CATEGORIES}</span>
                        )}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        data-testid="onboarding-save-btn"
                        className="px-5 py-2.5 rounded-full text-sm font-medium font-sans-ui transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: "#8F9779", color: "#FAF9F6" }}
                    >
                        {isFirstTime ? "Planter mon arbre" : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
};
