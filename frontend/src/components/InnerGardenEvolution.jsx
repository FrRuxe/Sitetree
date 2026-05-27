import { X, Leaf, Sprout, Flower2, Apple } from "lucide-react";
import { MOCK_THEMES, MOCK_FRUITS, SOFT_MICROCOPY } from "../lib/responses";

const StatBlock = ({ icon: Icon, value, label, testid }) => (
    <div
        data-testid={testid}
        className="rounded-2xl p-4 text-center"
        style={{ backgroundColor: "rgba(143, 151, 121, 0.08)" }}
    >
        <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#8F9779" }} />
        <p className="text-2xl font-medium text-stone-800 font-serif-reading">{value}</p>
        <p className="text-xs text-stone-500 mt-0.5 font-sans-ui">{label}</p>
    </div>
);

export const InnerGardenEvolution = ({ treeStats, recentFruits, onClose }) => {
    const fruits = recentFruits && recentFruits.length > 0 ? recentFruits : MOCK_FRUITS;
    const microcopy = SOFT_MICROCOPY[treeStats.leaves % SOFT_MICROCOPY.length];

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-8 bg-stone-900/30 backdrop-blur-sm animate-soft-in"
            onClick={onClose}
            data-testid="evolution-modal"
        >
            <div
                className="relative w-full max-w-2xl max-h-full md:max-h-[92vh] overflow-y-auto scroll-soft rounded-none md:rounded-3xl border border-stone-200 shadow-sm"
                style={{ backgroundColor: "#FAF9F6" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-stone-200/70"
                    style={{ backgroundColor: "#FAF9F6" }}
                >
                    <div>
                        <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                            Mon évolution
                        </p>
                        <h2 className="font-serif-reading text-2xl text-stone-800 mt-0.5">
                            {treeStats.stage}
                        </h2>
                        <p className="text-sm text-stone-500 mt-0.5 font-sans-ui">
                            Saison émotionnelle · {treeStats.season}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        data-testid="evolution-close"
                        className="p-1.5 rounded-full text-stone-500 hover:bg-stone-200/50"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    {/* Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                                Progression
                            </span>
                            <span className="text-xs text-stone-500 font-sans-ui">
                                {treeStats.progress}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-stone-200/70 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${treeStats.progress}%`,
                                    backgroundColor: "#8F9779",
                                }}
                            />
                        </div>
                        <p className="mt-3 text-sm text-stone-500 italic font-serif-reading">
                            {microcopy}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBlock icon={Leaf} value={treeStats.leaves} label="feuilles" testid="evo-leaves" />
                        <StatBlock icon={Sprout} value={treeStats.roots} label="racines" testid="evo-roots" />
                        <StatBlock icon={Flower2} value={treeStats.flowers} label="fleurs" testid="evo-flowers" />
                        <StatBlock icon={Apple} value={treeStats.fruits} label="fruits" testid="evo-fruits" />
                    </div>

                    {/* Thèmes */}
                    <div>
                        <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-3">
                            Thèmes les plus abordés
                        </p>
                        <div className="space-y-2.5">
                            {MOCK_THEMES.map((t) => (
                                <div key={t.label} className="flex items-center gap-3">
                                    <span className="text-sm text-stone-700 w-40 shrink-0 font-sans-ui">
                                        {t.label}
                                    </span>
                                    <div className="flex-1 h-1 rounded-full bg-stone-200/70 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${t.weight * 100}%`,
                                                backgroundColor: "#C07C66",
                                                opacity: 0.7,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-stone-500 w-10 text-right font-sans-ui">
                                        {Math.round(t.weight * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fruits symboliques */}
                    <div>
                        <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-3">
                            Derniers fruits symboliques
                        </p>
                        <ul className="space-y-2.5" data-testid="symbolic-fruits">
                            {fruits.slice(0, 5).map((f, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-3 rounded-2xl p-3.5"
                                    style={{ backgroundColor: "rgba(192, 124, 102, 0.07)" }}
                                >
                                    <Apple
                                        className="w-4 h-4 mt-0.5 shrink-0"
                                        style={{ color: "#C07C66" }}
                                    />
                                    <p className="font-serif-reading text-[15px] leading-relaxed text-stone-800">
                                        « {f} »
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-stone-500 italic text-center font-serif-reading pt-2">
                        Aucun classement. Aucun streak. Seulement ton chemin.
                    </p>
                </div>
            </div>
        </div>
    );
};
