import { useState } from "react";
import { MessageCircle, Moon, Repeat, Sparkles, Trash2 } from "lucide-react";

const MODE_ICONS = {
    free: MessageCircle,
    daily: Moon,
    rumination: Repeat,
    light: Sparkles,
};

const MS_DAY = 86400000;

// Catégorise une conversation par sa date relative au présent
function bucketFor(iso) {
    if (!iso) return "Plus ancien";
    const d = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const conv = new Date(d);
    conv.setHours(0, 0, 0, 0);
    const diff = Math.round((today - conv) / MS_DAY);
    if (diff <= 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff <= 7) return "Cette semaine";
    if (diff <= 30) return "Ce mois-ci";
    return "Plus ancien";
}

const BUCKETS_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Ce mois-ci", "Plus ancien"];

export const ConversationList = ({
    conversations,
    activeId,
    onSelect,
    onDelete,
}) => {
    const [confirmingId, setConfirmingId] = useState(null);

    // Trier décroissant par updatedAt (le plus récent en premier)
    const sorted = [...(conversations || [])].sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return db - da;
    });

    // Regrouper par bucket
    const grouped = sorted.reduce((acc, c) => {
        const b = bucketFor(c.updatedAt || c.createdAt);
        (acc[b] = acc[b] || []).push(c);
        return acc;
    }, {});

    if (sorted.length === 0) {
        return (
            <p className="text-xs text-stone-500 italic font-serif-reading px-3 py-2">
                Aucune réflexion encore. Commence quand tu veux.
            </p>
        );
    }

    return (
        <div className="space-y-3" data-testid="conversation-list">
            <p className="text-xs uppercase tracking-wider text-stone-500 px-3 font-sans-ui">
                Mes réflexions
            </p>
            <div className="max-h-72 overflow-y-auto scroll-soft pr-1 space-y-3">
                {BUCKETS_ORDER.filter((b) => grouped[b]).map((bucket) => (
                    <div key={bucket}>
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 px-3 mb-1 font-sans-ui">
                            {bucket}
                        </p>
                        <div className="space-y-0.5">
                            {grouped[bucket].map((c) => {
                                const Icon = MODE_ICONS[c.mode] || MessageCircle;
                                const isActive = c.id === activeId;
                                const isConfirming = confirmingId === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        data-testid={`conv-${c.id}`}
                                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                                            isActive
                                                ? "bg-stone-50/80"
                                                : "hover:bg-stone-200/40"
                                        }`}
                                    >
                                        <button
                                            onClick={() => onSelect(c.id)}
                                            className="flex-1 flex items-center gap-2 min-w-0 text-left"
                                        >
                                            <Icon
                                                className="w-3.5 h-3.5 shrink-0"
                                                style={{ color: isActive ? "#8F9779" : "#A8A29E" }}
                                            />
                                            <span
                                                className={`text-sm truncate font-sans-ui ${
                                                    isActive ? "text-stone-800" : "text-stone-600"
                                                }`}
                                            >
                                                {c.title}
                                            </span>
                                        </button>
                                        {isConfirming ? (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        onDelete(c.id);
                                                        setConfirmingId(null);
                                                    }}
                                                    data-testid={`conv-confirm-${c.id}`}
                                                    className="text-[11px] font-medium px-2 py-0.5 rounded font-sans-ui"
                                                    style={{ color: "#9F3645" }}
                                                >
                                                    Supprimer
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingId(null)}
                                                    className="text-[11px] text-stone-400 px-1 font-sans-ui"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmingId(c.id);
                                                }}
                                                data-testid={`conv-delete-${c.id}`}
                                                aria-label="Supprimer"
                                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 p-1 transition-opacity shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
