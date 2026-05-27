// Arbre intérieur version 2 — structure par branches catégorisées.
// - Si `categories` est fourni (3 à 6 entrées avec stats), on dessine N branches
//   structurantes, chacune avec sa couleur et son étiquette en bout.
// - Sinon, fallback sur la version générique (canopée organique).
//
// Chaque branche grandit visuellement en longueur et en épaisseur selon le nombre
// de feuilles + fleurs + fruits accumulés sur elle.

import { getBranchAngles } from "../lib/categories";

const SAGE = "#8F9779";
const SAGE_DEEP = "#6F7860";
const TRUNK = "#7A5A45";
const TRUNK_DEEP = "#5E4533";
const TERRA = "#C07C66";
const BLOSSOM = "#E8C7BD";
const FRUIT = "#A8694F";

const seeded = (i, salt = 0) => {
    const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
};

// Convertit hex → rgba string avec alpha
const hexToRgba = (hex, a) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Petite feuille colorée
const Leaf = ({ x, y, rot = 0, size = 3, color = SAGE, delay = 0 }) => (
    <g
        transform={`translate(${x} ${y}) rotate(${rot})`}
        className="animate-leaf-grow"
        style={{ animationDelay: `${delay}ms`, transformOrigin: "center" }}
    >
        <ellipse cx="0" cy="0" rx={size * 1.3} ry={size * 0.65} fill={color} opacity="0.92" />
    </g>
);

const Blossom = ({ x, y, size = 2.6, color = TERRA }) => (
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
        <circle cx="0" cy="0" r={size * 0.45} fill={color} />
    </g>
);

const FruitDot = ({ x, y, size = 2.4 }) => (
    <g transform={`translate(${x} ${y})`}>
        <circle cx="0" cy="0" r={size} fill={FRUIT} />
        <ellipse cx={-size * 0.3} cy={-size * 0.4} rx={size * 0.3} ry={size * 0.2} fill="#E8A98D" opacity="0.7" />
    </g>
);

// Dessine une branche catégorisée : tige + lobe de feuilles à la pointe + étiquette
const CategoryBranch = ({
    angle, // degrés
    length, // longueur visuelle 18→36
    thickness, // épaisseur 1.4→3.2
    color,
    label,
    leaves,
    flowers,
    fruits,
    originX,
    originY,
    showLabel,
}) => {
    const rad = (angle - 90) * (Math.PI / 180); // 0° = vers le haut
    const tipX = originX + Math.cos(rad) * length;
    const tipY = originY + Math.sin(rad) * length;
    // Courbe douce : point de contrôle entre origine et pointe, légèrement déporté
    const midX = originX + Math.cos(rad) * length * 0.55 + Math.cos(rad + Math.PI / 2) * 2;
    const midY = originY + Math.sin(rad) * length * 0.55 + Math.sin(rad + Math.PI / 2) * 2;

    // Lobe de feuillage : taille basée sur le contenu de la branche
    const lobeR = 5 + Math.min(leaves, 12) * 0.45;
    const visibleLeaves = Math.min(leaves, 14);
    const visibleFlowers = Math.min(flowers, 4);
    const visibleFruits = Math.min(fruits, 3);

    // Position de l'étiquette : décalée au-delà du lobe dans la direction de la branche
    const labelDist = lobeR + 5;
    const labelX = tipX + Math.cos(rad) * labelDist;
    const labelY = tipY + Math.sin(rad) * labelDist;

    // Largeur estimée de l'étiquette (chaque caractère ~3.5)
    const labelW = Math.max(label.length * 3.4 + 6, 16);

    return (
        <g>
            {/* Branche */}
            <path
                d={`M ${originX} ${originY} Q ${midX} ${midY} ${tipX} ${tipY}`}
                stroke={TRUNK}
                strokeWidth={thickness}
                fill="none"
                strokeLinecap="round"
                opacity="0.95"
            />
            {/* Lobe de feuillage coloré */}
            <ellipse
                cx={tipX}
                cy={tipY}
                rx={lobeR}
                ry={lobeR * 0.85}
                fill={hexToRgba(color, 0.18)}
            />
            <ellipse
                cx={tipX - 1}
                cy={tipY - 1}
                rx={lobeR * 0.7}
                ry={lobeR * 0.6}
                fill={hexToRgba(color, 0.32)}
            />

            {/* Feuilles individuelles autour du lobe */}
            {Array.from({ length: visibleLeaves }).map((_, i) => {
                const t = seeded(i, 17);
                const t2 = seeded(i, 23);
                const a = t * Math.PI * 2;
                const r = lobeR * (0.6 + t2 * 0.6);
                const lx = tipX + Math.cos(a) * r;
                const ly = tipY + Math.sin(a) * r * 0.85;
                const size = 1.8 + seeded(i, 31) * 1.1;
                const rot = (seeded(i, 37) - 0.5) * 70;
                return (
                    <Leaf
                        key={`bl-${i}`}
                        x={lx}
                        y={ly}
                        rot={rot}
                        size={size}
                        color={color}
                        delay={i * 60}
                    />
                );
            })}

            {/* Fleurs */}
            {Array.from({ length: visibleFlowers }).map((_, i) => {
                const t = seeded(i, 41);
                const t2 = seeded(i, 43);
                const a = t * Math.PI * 2;
                const r = lobeR * (0.3 + t2 * 0.4);
                return (
                    <Blossom
                        key={`bf-${i}`}
                        x={tipX + Math.cos(a) * r}
                        y={tipY + Math.sin(a) * r * 0.8}
                        size={2.4}
                        color={color}
                    />
                );
            })}

            {/* Fruits */}
            {Array.from({ length: visibleFruits }).map((_, i) => {
                const t = seeded(i, 53);
                const a = t * Math.PI * 2;
                const r = lobeR * 0.45;
                return (
                    <FruitDot
                        key={`bfr-${i}`}
                        x={tipX + Math.cos(a) * r}
                        y={tipY + Math.sin(a) * r * 0.8 + 1.5}
                        size={2.2}
                    />
                );
            })}

            {/* Étiquette colorée */}
            {showLabel && (
                <g
                    transform={`translate(${labelX} ${labelY})`}
                    style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))" }}
                >
                    <rect
                        x={-labelW / 2}
                        y={-3.5}
                        width={labelW}
                        height={7}
                        rx={3.5}
                        ry={3.5}
                        fill={color}
                        opacity="0.92"
                    />
                    <text
                        x="0"
                        y="1.2"
                        textAnchor="middle"
                        fontSize="4"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="500"
                        fill="#FAF9F6"
                        style={{ letterSpacing: "0.02em" }}
                    >
                        {label}
                    </text>
                </g>
            )}
        </g>
    );
};

export const InnerTreeSvg = ({
    stageKey = "seed",
    leaves = 0,
    flowers = 0,
    fruits = 0,
    categories = null, // [{id, label, color, leaves, flowers, fruits}]
    showLabels = true,
    className = "",
    breathe = true,
}) => {
    const hasCategories = Array.isArray(categories) && categories.length >= 1;

    // Tronc : même logique que la version précédente
    const trunkPath =
        stageKey === "seed"
            ? null
            : stageKey === "sprout"
              ? "M59 124 Q 60 108 60 92"
              : stageKey === "growing"
                ? "M57 125 Q 60 100 60 70"
                : "M55 125 Q 60 92 60 60";

    const trunkWidth =
        stageKey === "sprout" ? 2.2 : stageKey === "growing" ? 3.4 : 4.6;

    // Point d'origine des branches (apex du tronc selon le stade)
    const branchOriginY =
        stageKey === "sprout" ? 92 : stageKey === "growing" ? 70 : 60;
    const branchOriginX = stageKey === "alive" ? 60 : 60;

    // Si on a des catégories, on dessine les branches structurantes
    const angles = hasCategories ? getBranchAngles(categories.length) : [];

    // Sinon, fallback : on garde la canopée générique
    const showGenericCanopy = !hasCategories && stageKey !== "seed";

    return (
        <svg
            viewBox="0 0 120 140"
            data-tree-svg="true"
            data-categories={hasCategories ? categories.length : 0}
            className={`${className} ${breathe ? "animate-breathe" : ""}`}
            aria-label="Ton arbre intérieur"
            role="img"
        >
            <defs>
                <radialGradient id="ground-glow-2" cx="50%" cy="100%" r="60%">
                    <stop offset="0%" stopColor="#E8DFCB" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#E8DFCB" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Halo de sol */}
            <ellipse cx="60" cy="128" rx="50" ry="6" fill="url(#ground-glow-2)" />

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

            {/* Racines à partir de la pousse */}
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

            {/* Branches catégorisées (uniquement si l'arbre a au moins atteint le stade pousse) */}
            {hasCategories && stageKey !== "seed" &&
                categories.map((cat, i) => {
                    const angle = angles[i];
                    const total = cat.leaves + cat.flowers + cat.fruits;
                    // Longueur 22-38, épaisseur 1.6-3.0
                    const length = 22 + Math.min(total, 18) * 0.9;
                    const thickness = 1.6 + Math.min(total, 14) * 0.1;
                    return (
                        <CategoryBranch
                            key={cat.id}
                            angle={angle}
                            length={length}
                            thickness={thickness}
                            color={cat.color}
                            label={cat.label}
                            leaves={cat.leaves}
                            flowers={cat.flowers}
                            fruits={cat.fruits}
                            originX={branchOriginX}
                            originY={branchOriginY}
                            showLabel={showLabels}
                        />
                    );
                })}

            {/* Fallback canopée générique si pas de catégories */}
            {showGenericCanopy && (
                <g>
                    {stageKey === "sprout" && (
                        <ellipse cx="60" cy="89" rx="10" ry="7" fill={SAGE} opacity="0.85" />
                    )}
                    {stageKey === "growing" && (
                        <>
                            <circle cx="60" cy="64" r="20" fill={SAGE} opacity="0.92" />
                            <circle cx="42" cy="68" r="11" fill={SAGE} opacity="0.78" />
                            <circle cx="78" cy="68" r="11" fill={SAGE} opacity="0.78" />
                        </>
                    )}
                    {stageKey === "alive" && (
                        <>
                            <circle cx="60" cy="48" r="26" fill={SAGE} opacity="0.92" />
                            <circle cx="34" cy="56" r="16" fill={SAGE} opacity="0.85" />
                            <circle cx="86" cy="56" r="16" fill={SAGE} opacity="0.85" />
                            <circle cx="60" cy="30" r="12" fill={SAGE} opacity="0.88" />
                        </>
                    )}
                </g>
            )}

            {/* Feuilles "tronc" (messages sans catégorie) — petites feuilles le long du tronc */}
            {!hasCategories && stageKey !== "seed" &&
                Array.from({ length: Math.min(leaves, 18) }).map((_, i) => {
                    const t = seeded(i, 5);
                    const t2 = seeded(i, 9);
                    const a = t * Math.PI * 2;
                    const cx = 60;
                    const cy = branchOriginY - 4;
                    const r = 16 + t2 * 8;
                    return (
                        <Leaf
                            key={`tl-${i}`}
                            x={cx + Math.cos(a) * r}
                            y={cy + Math.sin(a) * r * 0.7}
                            rot={(seeded(i, 13) - 0.5) * 70}
                            size={2.1 + seeded(i, 21) * 1.1}
                            color={seeded(i, 27) > 0.6 ? SAGE_DEEP : SAGE}
                            delay={i * 70}
                        />
                    );
                })}

            {/* Feuilles "tronc" en plus quand on a des catégories : feuillettes
                discrètes près du tronc pour les messages sans tag */}
            {hasCategories && leaves > 0 && stageKey !== "seed" &&
                Array.from({ length: Math.min(leaves, 6) }).map((_, i) => {
                    const t = seeded(i, 91);
                    const t2 = seeded(i, 93);
                    const a = t * Math.PI * 2;
                    const yOffset = 70 + t2 * 30;
                    const xOffset = Math.cos(a) * 4;
                    return (
                        <Leaf
                            key={`gtl-${i}`}
                            x={60 + xOffset}
                            y={yOffset}
                            rot={(seeded(i, 95) - 0.5) * 60}
                            size={1.8}
                            color={SAGE_DEEP}
                            delay={i * 70}
                        />
                    );
                })}

            {/* Fleurs / fruits "tronc" sans catégorie */}
            {!hasCategories && stageKey !== "seed" &&
                Array.from({ length: Math.min(flowers, 6) }).map((_, i) => {
                    const t = seeded(i, 101);
                    const t2 = seeded(i, 103);
                    const a = t * Math.PI * 2;
                    const cx = 60;
                    const cy = branchOriginY - 6;
                    const r = 10 + t2 * 8;
                    return (
                        <Blossom
                            key={`tf-${i}`}
                            x={cx + Math.cos(a) * r}
                            y={cy + Math.sin(a) * r * 0.7}
                            size={2.6}
                        />
                    );
                })}
            {!hasCategories && stageKey !== "seed" &&
                Array.from({ length: Math.min(fruits, 5) }).map((_, i) => {
                    const t = seeded(i, 111);
                    const t2 = seeded(i, 113);
                    const a = t * Math.PI * 2;
                    const cx = 60;
                    const cy = branchOriginY - 2;
                    const r = 10 + t2 * 6;
                    return (
                        <FruitDot
                            key={`tfr-${i}`}
                            x={cx + Math.cos(a) * r}
                            y={cy + Math.sin(a) * r * 0.7 + 1}
                            size={2.4}
                        />
                    );
                })}
        </svg>
    );
};
