// Arbre intérieur — SVG réutilisable, plus riche que la version compacte.
// Le rendu varie selon le stade et affiche les feuilles, fleurs et fruits réels.
// Aucune image externe, tout est en SVG vectoriel pour rester léger et net à toute taille.

const SAGE = "#8F9779";
const SAGE_DEEP = "#6F7860";
const TRUNK = "#7A5A45";
const TRUNK_DEEP = "#5E4533";
const TERRA = "#C07C66";
const BLOSSOM = "#E8C7BD";
const FRUIT = "#A8694F";

// Positions stables pour les feuilles/fleurs/fruits selon leur index.
// On utilise un pseudo-random déterministe basé sur l'index pour éviter le clignotement.
const seededAngle = (i, salt = 0) => {
    const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
};

// Place un point dans la canopée selon l'index (distribution douce).
const canopyPoint = (i, salt = 0, radius = 26, cx = 60, cy = 56) => {
    const t = seededAngle(i, salt);
    const t2 = seededAngle(i, salt + 1);
    const angle = t * Math.PI * 2;
    const r = radius * (0.4 + t2 * 0.6);
    return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 0.85,
    };
};

const Leaf = ({ x, y, rot = 0, size = 4, delay = 0, color = SAGE }) => (
    <g
        transform={`translate(${x} ${y}) rotate(${rot})`}
        className="animate-leaf-grow"
        style={{ animationDelay: `${delay}ms`, transformOrigin: "center" }}
    >
        <ellipse cx="0" cy="0" rx={size * 1.3} ry={size * 0.7} fill={color} opacity="0.9" />
        <line x1={-size * 1.2} y1="0" x2={size * 1.2} y2="0" stroke={SAGE_DEEP} strokeWidth="0.4" opacity="0.5" />
    </g>
);

const Blossom = ({ x, y, size = 3 }) => (
    <g transform={`translate(${x} ${y})`}>
        {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
                key={a}
                cx="0"
                cy={-size}
                rx={size * 0.55}
                ry={size}
                fill={BLOSSOM}
                transform={`rotate(${a})`}
                opacity="0.95"
            />
        ))}
        <circle cx="0" cy="0" r={size * 0.45} fill={TERRA} />
    </g>
);

const Fruit = ({ x, y, size = 2.6 }) => (
    <g transform={`translate(${x} ${y})`}>
        <circle cx="0" cy="0" r={size} fill={FRUIT} />
        <ellipse cx={-size * 0.3} cy={-size * 0.4} rx={size * 0.3} ry={size * 0.2} fill="#E8A98D" opacity="0.7" />
        <path d={`M0 ${-size} l0 -${size * 0.6}`} stroke={SAGE_DEEP} strokeWidth="0.6" />
    </g>
);

export const InnerTreeSvg = ({
    stageKey = "seed",
    leaves = 0,
    flowers = 0,
    fruits = 0,
    className = "",
    breathe = true,
}) => {
    // Limites visuelles raisonnables (l'arbre reste lisible).
    const visibleLeaves = Math.min(leaves, 40);
    const visibleFlowers = Math.min(flowers, 10);
    const visibleFruits = Math.min(fruits, 8);

    // Dessin du tronc selon le stade.
    const trunkPath =
        stageKey === "seed"
            ? null
            : stageKey === "sprout"
              ? "M59 124 Q 60 108 60 92"
              : stageKey === "growing"
                ? "M57 125 Q 60 100 60 70"
                : "M55 125 Q 60 92 60 50";

    const trunkWidth =
        stageKey === "sprout" ? 2.2 : stageKey === "growing" ? 3.4 : 4.6;

    // Canopée principale selon le stade
    const canopy = (() => {
        if (stageKey === "seed") return null;
        if (stageKey === "sprout") {
            return (
                <g>
                    <ellipse cx="60" cy="89" rx="10" ry="7" fill={SAGE} opacity="0.85" />
                    <ellipse cx="54" cy="85" rx="5" ry="3.5" fill={SAGE} opacity="0.6" />
                    <ellipse cx="66" cy="85" rx="5" ry="3.5" fill={SAGE} opacity="0.6" />
                </g>
            );
        }
        if (stageKey === "growing") {
            return (
                <g>
                    <circle cx="60" cy="64" r="20" fill={SAGE} opacity="0.92" />
                    <circle cx="42" cy="68" r="11" fill={SAGE} opacity="0.78" />
                    <circle cx="78" cy="68" r="11" fill={SAGE} opacity="0.78" />
                    <circle cx="60" cy="50" r="9" fill={SAGE} opacity="0.85" />
                </g>
            );
        }
        return (
            <g>
                <circle cx="60" cy="48" r="26" fill={SAGE} opacity="0.92" />
                <circle cx="34" cy="56" r="16" fill={SAGE} opacity="0.85" />
                <circle cx="86" cy="56" r="16" fill={SAGE} opacity="0.85" />
                <circle cx="60" cy="30" r="12" fill={SAGE} opacity="0.88" />
                <circle cx="45" cy="36" r="9" fill={SAGE} opacity="0.78" />
                <circle cx="75" cy="36" r="9" fill={SAGE} opacity="0.78" />
            </g>
        );
    })();

    // Centre & rayon de canopée selon stade pour placer feuilles/fleurs/fruits
    const canopyCenter =
        stageKey === "sprout"
            ? { cx: 60, cy: 88, r: 9 }
            : stageKey === "growing"
              ? { cx: 60, cy: 62, r: 22 }
              : { cx: 60, cy: 46, r: 30 };

    return (
        <svg
            viewBox="0 0 120 140"
            className={`${className} ${breathe ? "animate-breathe" : ""}`}
            aria-label="Ton arbre intérieur"
            role="img"
        >
            <defs>
                <radialGradient id="ground-glow" cx="50%" cy="100%" r="60%">
                    <stop offset="0%" stopColor="#E8DFCB" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#E8DFCB" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="canopy-light" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A8B292" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6F7860" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Halo de sol */}
            <ellipse cx="60" cy="128" rx="48" ry="6" fill="url(#ground-glow)" />

            {/* Sol */}
            <line
                x1="14"
                y1="125"
                x2="106"
                y2="125"
                stroke="#D8CFC0"
                strokeWidth="1"
                strokeDasharray="2 3"
            />

            {/* Racines visibles à partir de la pousse */}
            {stageKey !== "seed" && (
                <g stroke={TRUNK_DEEP} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55">
                    <path d="M60 125 Q 50 132 38 134" />
                    <path d="M60 125 Q 70 132 82 134" />
                    <path d="M60 125 Q 60 134 58 138" />
                    {stageKey !== "sprout" && (
                        <>
                            <path d="M60 125 Q 44 130 30 131" />
                            <path d="M60 125 Q 76 130 90 131" />
                        </>
                    )}
                </g>
            )}

            {/* Tronc */}
            {trunkPath ? (
                <>
                    <path
                        d={trunkPath}
                        stroke={TRUNK}
                        strokeWidth={trunkWidth}
                        fill="none"
                        strokeLinecap="round"
                    />
                    {/* Texture du tronc */}
                    <path
                        d={trunkPath}
                        stroke={TRUNK_DEEP}
                        strokeWidth={trunkWidth * 0.4}
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.35"
                        transform="translate(-1 0)"
                    />
                </>
            ) : (
                // Graine endormie : petite forme ronde dans la terre
                <g>
                    <ellipse cx="60" cy="123" rx="6" ry="4" fill={TRUNK} />
                    <path
                        d="M60 119 Q 62 115 60 112"
                        stroke={SAGE}
                        strokeWidth="1.4"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.6"
                    />
                </g>
            )}

            {/* Branches */}
            {(stageKey === "growing" || stageKey === "alive") && (
                <g stroke={TRUNK} strokeWidth="2.2" fill="none" strokeLinecap="round">
                    <path d="M60 80 Q 45 70 32 64" />
                    <path d="M60 80 Q 75 70 88 64" />
                    {stageKey === "alive" && (
                        <>
                            <path d="M60 64 Q 46 52 34 46" />
                            <path d="M60 64 Q 74 52 86 46" />
                            <path d="M60 50 Q 55 36 56 26" />
                        </>
                    )}
                </g>
            )}

            {/* Canopée */}
            {canopy}

            {/* Lumière sur la canopée */}
            {canopy && (
                <ellipse
                    cx={canopyCenter.cx - 4}
                    cy={canopyCenter.cy - canopyCenter.r * 0.4}
                    rx={canopyCenter.r * 0.6}
                    ry={canopyCenter.r * 0.4}
                    fill="url(#canopy-light)"
                />
            )}

            {/* Feuilles supplémentaires (organiques) — uniquement si pas en graine */}
            {stageKey !== "seed" &&
                Array.from({ length: visibleLeaves }).map((_, i) => {
                    const { x, y } = canopyPoint(i, 1, canopyCenter.r * 1.05, canopyCenter.cx, canopyCenter.cy);
                    const rot = (seededAngle(i, 2) - 0.5) * 80;
                    const size = 2.4 + seededAngle(i, 3) * 1.4;
                    const c = seededAngle(i, 4) > 0.6 ? SAGE_DEEP : SAGE;
                    return (
                        <Leaf
                            key={`l-${i}`}
                            x={x}
                            y={y}
                            rot={rot}
                            size={size}
                            delay={i * 80}
                            color={c}
                        />
                    );
                })}

            {/* Fleurs */}
            {stageKey !== "seed" &&
                Array.from({ length: visibleFlowers }).map((_, i) => {
                    const { x, y } = canopyPoint(i, 7, canopyCenter.r * 0.85, canopyCenter.cx, canopyCenter.cy);
                    return <Blossom key={`f-${i}`} x={x} y={y} size={2.8} />;
                })}

            {/* Fruits */}
            {stageKey !== "seed" &&
                Array.from({ length: visibleFruits }).map((_, i) => {
                    const { x, y } = canopyPoint(i, 11, canopyCenter.r * 0.7, canopyCenter.cx, canopyCenter.cy + 4);
                    return <Fruit key={`fr-${i}`} x={x} y={y} size={2.8} />;
                })}
        </svg>
    );
};
