import { Leaf, Sprout, Flower2, Apple } from "lucide-react";

// SVG d'arbre stylisé qui évolue selon le stade.
const TreeSvg = ({ stageKey }) => {
    // Tronc commun, feuillage qui grandit
    const sage = "#8F9779";
    const trunk = "#7A5A45";

    return (
        <svg
            viewBox="0 0 120 140"
            className="w-full h-full animate-breathe"
            aria-hidden="true"
        >
            {/* Sol */}
            <line
                x1="10"
                y1="125"
                x2="110"
                y2="125"
                stroke="#D8CFC0"
                strokeWidth="1"
                strokeDasharray="2 3"
            />

            {/* Racines (visibles dès la pousse) */}
            {stageKey !== "seed" && (
                <g stroke={trunk} strokeWidth="1.2" fill="none" opacity="0.6">
                    <path d="M60 125 Q 50 132 40 134" />
                    <path d="M60 125 Q 70 132 80 134" />
                    <path d="M60 125 Q 60 134 58 138" />
                </g>
            )}

            {/* Tronc */}
            {stageKey === "seed" ? (
                <ellipse cx="60" cy="120" rx="6" ry="4" fill={trunk} opacity="0.7" />
            ) : (
                <path
                    d={
                        stageKey === "sprout"
                            ? "M58 125 Q 60 110 60 95"
                            : stageKey === "growing"
                              ? "M57 125 Q 60 100 60 75"
                              : "M55 125 Q 60 95 60 55"
                    }
                    stroke={trunk}
                    strokeWidth={stageKey === "sprout" ? 2 : stageKey === "growing" ? 3 : 4}
                    fill="none"
                    strokeLinecap="round"
                />
            )}

            {/* Branches (à partir de growing) */}
            {(stageKey === "growing" || stageKey === "alive") && (
                <g stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round">
                    <path d="M60 85 Q 45 78 35 72" />
                    <path d="M60 85 Q 75 78 85 72" />
                    {stageKey === "alive" && (
                        <>
                            <path d="M60 70 Q 48 60 38 55" />
                            <path d="M60 70 Q 72 60 82 55" />
                        </>
                    )}
                </g>
            )}

            {/* Feuillage */}
            {stageKey === "sprout" && (
                <g fill={sage}>
                    <ellipse cx="60" cy="92" rx="9" ry="6" />
                    <ellipse cx="55" cy="88" rx="5" ry="3" opacity="0.7" />
                </g>
            )}

            {stageKey === "growing" && (
                <g fill={sage}>
                    <circle cx="60" cy="72" r="14" opacity="0.9" />
                    <circle cx="42" cy="74" r="8" opacity="0.7" />
                    <circle cx="78" cy="74" r="8" opacity="0.7" />
                </g>
            )}

            {stageKey === "alive" && (
                <g>
                    <circle cx="60" cy="52" r="20" fill={sage} opacity="0.9" />
                    <circle cx="38" cy="58" r="13" fill={sage} opacity="0.8" />
                    <circle cx="82" cy="58" r="13" fill={sage} opacity="0.8" />
                    <circle cx="60" cy="38" r="10" fill={sage} opacity="0.85" />
                    {/* Quelques fleurs / fruits */}
                    <circle cx="48" cy="50" r="2" fill="#C07C66" />
                    <circle cx="72" cy="46" r="2" fill="#C07C66" />
                    <circle cx="58" cy="62" r="1.6" fill="#E5C9A0" />
                </g>
            )}

            {/* Graine endormie */}
            {stageKey === "seed" && (
                <ellipse cx="60" cy="120" rx="4" ry="2.5" fill={trunk} />
            )}
        </svg>
    );
};

export const TreeWidget = ({
    stage,
    stageKey,
    progress,
    season,
    leaves,
    roots,
    flowers,
    fruits,
    onOpenEvolution,
}) => {
    return (
        <button
            data-testid="tree-widget"
            onClick={onOpenEvolution}
            className="w-full text-left rounded-2xl p-4 transition-colors hover:bg-stone-200/40"
            style={{ backgroundColor: "rgba(143, 151, 121, 0.08)" }}
        >
            <div className="flex items-start gap-3">
                <div className="w-16 h-20 shrink-0 -mt-1">
                    <TreeSvg stageKey={stageKey} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                        Ton arbre intérieur
                    </p>
                    <p className="text-sm font-medium text-stone-800 mt-0.5 font-sans-ui">
                        {stage}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5 font-sans-ui">{season}</p>

                    {/* Barre de progression */}
                    <div className="mt-2 h-1 w-full rounded-full bg-stone-200/70 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: "#8F9779",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats compactes */}
            <div className="mt-3 grid grid-cols-4 gap-2">
                <Stat icon={Leaf} value={leaves} label="feuilles" testid="stat-leaves" />
                <Stat icon={Sprout} value={roots} label="racines" testid="stat-roots" />
                <Stat icon={Flower2} value={flowers} label="fleurs" testid="stat-flowers" />
                <Stat icon={Apple} value={fruits} label="fruits" testid="stat-fruits" />
            </div>

            <p className="mt-3 text-xs text-stone-500 italic font-serif-reading leading-relaxed">
                Ton arbre grandit à ton rythme.
            </p>
        </button>
    );
};

const Stat = ({ icon: Icon, value, label, testid }) => (
    <div className="flex flex-col items-center gap-0.5" data-testid={testid}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#8F9779" }} />
        <span className="text-xs font-medium text-stone-700 font-sans-ui">{value}</span>
        <span className="text-[10px] text-stone-500 font-sans-ui">{label}</span>
    </div>
);
