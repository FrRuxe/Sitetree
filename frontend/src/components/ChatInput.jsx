import { useRef, useEffect, useState } from "react";
import { ArrowUp, EyeOff, Sparkles } from "lucide-react";
import { MODE_PLACEHOLDERS } from "../lib/responses";
import { CategoryChips } from "./CategoryChips";
import { detectBranch } from "../lib/api";

export const ChatInput = ({
    value,
    onChange,
    onSend,
    mode,
    disabled,
    incognito,
    categories,
    selectedCategoryId,
    onSelectCategory,
}) => {
    const textareaRef = useRef(null);
    const userTouchedChipRef = useRef(false);
    const [suggestedId, setSuggestedId] = useState(null);

    // Auto-resize
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [value]);

    // Reset le flag quand l'utilisateur efface tout
    useEffect(() => {
        if (!value.trim()) {
            userTouchedChipRef.current = false;
            setSuggestedId(null);
        }
    }, [value]);

    // Auto-suggestion par debounce 600ms quand l'utilisateur tape
    useEffect(() => {
        if (!categories || categories.length === 0) return;
        const text = value.trim();
        if (text.length < 8) {
            setSuggestedId(null);
            return;
        }
        const handle = setTimeout(async () => {
            const detection = await detectBranch(text, categories);
            if (detection?.branch_id) {
                setSuggestedId(detection.branch_id);
                // Auto-pré-sélection uniquement si l'utilisateur n'a pas touché aux chips
                if (!userTouchedChipRef.current && !selectedCategoryId) {
                    onSelectCategory(detection.branch_id);
                }
            } else {
                setSuggestedId(null);
            }
        }, 600);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, categories]);

    const handleSelectChip = (id) => {
        userTouchedChipRef.current = true;
        onSelectCategory(id);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                userTouchedChipRef.current = false;
                onSend();
            }
        }
    };

    const hasContent = value.trim().length > 0;
    const activeCat = categories?.find((c) => c.id === selectedCategoryId);

    return (
        <div className="px-4 md:px-8 pb-5 pt-3" data-testid="chat-input-container">
            <div className="max-w-3xl mx-auto">
                {incognito && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-stone-500 italic font-sans-ui">
                        <EyeOff className="w-3 h-3" />
                        Mode incognito actif — rien n'est conservé.
                    </div>
                )}

                {categories && categories.length > 0 && (
                    <div className="flex items-center gap-2">
                        <CategoryChips
                            categories={categories}
                            selectedId={selectedCategoryId}
                            onSelect={handleSelectChip}
                        />
                        {suggestedId && suggestedId === selectedCategoryId && (
                            <span
                                className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-sans-ui italic"
                                data-testid="auto-tag-indicator"
                            >
                                <Sparkles className="w-3 h-3" style={{ color: "#8F9779" }} />
                                suggérée
                            </span>
                        )}
                    </div>
                )}

                <div
                    className="relative rounded-3xl border transition-all duration-200 focus-within:shadow-sm"
                    style={{
                        backgroundColor: "rgba(240, 235, 225, 0.35)",
                        borderColor: activeCat
                            ? `${activeCat.color}80`
                            : "rgba(214, 207, 194, 1)",
                    }}
                >
                    <textarea
                        ref={textareaRef}
                        data-testid="chat-input"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder={
                            activeCat
                                ? `À propos de ${activeCat.label}…`
                                : MODE_PLACEHOLDERS[mode]
                        }
                        disabled={disabled}
                        className="w-full resize-none bg-transparent px-5 py-4 pr-14 outline-none text-[15px] text-stone-800 placeholder:text-stone-400 font-sans-ui leading-relaxed disabled:opacity-50"
                        style={{ maxHeight: "200px" }}
                    />
                    <button
                        data-testid="send-btn"
                        onClick={() => {
                            if (hasContent && !disabled) {
                                userTouchedChipRef.current = false;
                                onSend();
                            }
                        }}
                        aria-label="Envoyer"
                        className={`absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                            hasContent && !disabled
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-90 pointer-events-none"
                        }`}
                        style={{
                            backgroundColor: activeCat ? activeCat.color : "#8F9779",
                            color: "#FAF9F6",
                        }}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-2.5 text-[11px] text-stone-400 text-center font-sans-ui">
                    Cet espace ne remplace pas un professionnel de santé. En cas d'urgence,
                    appelle le 3114.
                </p>
            </div>
        </div>
    );
};
