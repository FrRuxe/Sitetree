import { X, Leaf, Sprout, Flower2, Apple, Pencil } from "lucide-react";
import { InnerTreeSvg } from "./InnerTreeSvg";
import { MOCK_FRUITS, SOFT_MICROCOPY } from "../lib/responses";

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

export const InnerGardenEvolution = ({
    treeStats,
    recentFruits,
    onClose,
    onEditCategories,
}) => {
    const fruits = recentFruits && recentFruits.length > 0 ? recentFruits : MOCK_FRUITS;
    const microcopy = SOFT_MICROCOPY[treeStats.leaves % SOFT_MICROCOPY.length];
    const cats = treeStats.categories || [];

    // Pour la barre par branche : total = leaves + flowers + fruits par catégorie
    const branchTotals = cats.map((c) => c.leaves + c.flowers + c.fruits);
    const maxBranch = Math.max(1, ...branchTotals);

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
                <button
                    onClick={onClose}
                    data-testid="evolution-close"
                    className="absolute top-4 right-4 z-20 p-1.5 rounded-full text-stone-500 hover:bg-stone-200/50 bg-stone-50/80 backdrop-blur"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Hero arbre */}
                <div
                    className="relative px-6 pt-8 pb-4"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(143, 151, 121, 0.10) 0%, rgba(250, 249, 246, 0) 100%)",
                    }}
                >
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui text-center">
                        Mon évolution
                    </p>
                    <div className="mx-auto w-72 h-80 md:w-96 md:h-[26rem] mt-2">
                        <InnerTreeSvg
                            stageKey={treeStats.stageKey}
                            leaves={treeStats.leaves}
                            flowers={treeStats.flowers}
                            fruits={treeStats.fruits}
                            categories={treeStats.categories}
                            showLabels={true}
                            className="w-full h-full"
                        />
                    </div>
                    <h2 className="font-serif-reading text-2xl md:text-3xl text-stone-800 text-center mt-2">
                        {treeStats.stage}
                    </h2>
                    <p className="text-sm text-stone-500 mt-1 font-sans-ui text-center">
                        Saison émotionnelle · {treeStats.season}
                    </p>
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

                    {/* Stats globales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBlock icon={Leaf} value={treeStats.leaves} label="feuilles" testid="evo-leaves" />
                        <StatBlock icon={Sprout} value={treeStats.roots} label="racines" testid="evo-roots" />
                        <StatBlock icon={Flower2} value={treeStats.flowers} label="fleurs" testid="evo-flowers" />
                        <StatBlock icon={Apple} value={treeStats.fruits} label="fruits" testid="evo-fruits" />
                    </div>

                    {/* Détail par branche */}
                    {cats.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                                    Tes branches
                                </p>
                                {onEditCategories && (
                                    <button
                                        onClick={onEditCategories}
                                        data-testid="evo-edit-categories"
                                        className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-sans-ui transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Modifier
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2.5" data-testid="branches-list">
                                {cats.map((c, idx) => {
                                    const total = branchTotals[idx];
                                    const pct = (total / maxBranch) * 100;
                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-2xl p-3"
                                            style={{
                                                backgroundColor: `${c.color}10`,
                                            }}
                                            data-testid={`branch-row-${c.id}`}
                                        >
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: c.color }}
                                                />
                                                <span className="text-sm font-medium text-stone-800 font-sans-ui flex-1">
                                                    {c.label}
                                                </span>
                                                <span className="text-xs text-stone-500 font-sans-ui">
                                                    {total} {total > 1 ? "éléments" : "élément"}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full rounded-full bg-stone-200/50 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: c.color,
                                                        opacity: 0.75,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 font-sans-ui">
                                                <span className="flex items-center gap-1">
                                                    <Leaf className="w-3 h-3" style={{ color: c.color }} />
                                                    {c.leaves}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Flower2 className="w-3 h-3" style={{ color: c.color }} />
                                                    {c.flowers}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Apple className="w-3 h-3" style={{ color: c.color }} />
                                                    {c.fruits}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
