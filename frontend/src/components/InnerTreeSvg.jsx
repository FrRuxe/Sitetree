// Arbre intérieur — version organique avec seed utilisateur et palette saisonnière.
// - Tronc en Bézier doux (courbure perturbée par le seed)
// - Branches catégorisées en Q-curves avec angles perturbés par le seed
// - Feuilles en ellipses pivotées, teinte légèrement décalée par le seed
// - Racines visibles dont l'épaisseur croît avec leur nombre
// - Palette adaptée à la saison émotionnelle
// - Smooth growth via heightFactor (10 stades)
// - Decay visuel : branchShrink ∈ [0, 0.2] réduit la longueur des branches

import { getBranchAngles } from "../lib/categories";
import { seedRand, seedJitter } from "../lib/userSeed";

const TRUNK_BASE = "#7A5A45";
const TRUNK_DEEP = "#5E4533";

// Palettes par saison (couleurs des feuilles + accent)
const SEASON_PALETTES = {
    "Hiver doux": {
        leafBase: "#A8B0A0",
        leafAlt: "#94998C",
        accent: "#C7B89D",
    },
    "Printemps": {
        leafBase: "#9DB585",
        leafAlt: "#85A06C",
        accent: "#E8C7BD",
    },
    "Été calme": {
        leafBase: "#8F9779",
        leafAlt: "#6F7860",
        accent: "#C07C66",
    },
    "Automne lumineux": {
        leafBase: "#A89568",
        leafAlt: "#C07C66",
        accent: "#8F9779",
    },
};

const DEFAULT_PALETTE = SEASON_PALETTES["Été calme"];

const hexToRgba = (hex, a) => {
    const h = hex.replace("#", "");
    const n = parseInt(
        h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
        16
    );
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Décale légèrement la teinte d'un hex (h ∈ -30..+30 degrés HSL).
const shiftHue = (hex, degShift) => {
    const h = hex.replace("#", "");
    const n = parseInt(
        h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
        16
    );
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return hex;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let hh;
    if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh = ((hh * 60 + degShift) % 360 + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = l - c / 2;
    let rr, gg, bb;
    if (hh < 60) [rr, gg, bb] = [c, x, 0];
    else if (hh < 120) [rr, gg, bb] = [x, c, 0];
    else if (hh < 180) [rr, gg, bb] = [0, c, x];
    else if (hh < 240) [rr, gg, bb] = [0, x, c];
    else if (hh < 300) [rr, gg, bb] = [x, 0, c];
    else [rr, gg, bb] = [c, 0, x];
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
};

// Composants atomiques
const Leaf = ({ x, y, rot = 0, size = 3, color, delay = 0 }) => (
    <g
        transform={`translate(${x} ${y}) rotate(${rot})`}
        className="animate-leaf-grow"
        style={{ animationDelay: `${delay}ms`, transformOrigin: "center" }}
    >
        <ellipse cx="0" cy="0" rx={size * 1.4} ry={size * 0.6} fill={color} opacity="0.92" />
        <line
            x1={-size * 1.3}
            y1="0"
            x2={size * 1.3}
            y2="0"
            stroke="#4A5240"
            strokeWidth="0.3"
            opacity="0.35"
        />
    </g>
);

const Blossom = ({ x, y, size = 2.6, color }) => (
    <g transform={`translate(${x} ${y})`}>
        {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
                key={a}
                cx="0"
                cy={-size}
                rx={size * 0.55}
                ry={size}
                fill="#E8C7BD"
                transform={`rotate(${a})`}
                opacity="0.95"
            />
        ))}
        <circle cx="0" cy="0" r={size * 0.45} fill={color} />
    </g>
);

const FruitDot = ({ x, y, size = 2.4 }) => (
    <g transform={`translate(${x} ${y})`}>
        <circle cx="0" cy="0" r={size} fill="#A8694F" />
        <ellipse
            cx={-size * 0.3}
            cy={-size * 0.4}
            rx={size * 0.3}
            ry={size * 0.2}
            fill="#E8A98D"
            opacity="0.7"
        />
    </g>
);

const renderLeavesOnLobe = (count, cx, cy, lobeR, color, seed, salt) => {
    return Array.from({ length: count }).map((_, i) => {
        const angle = seedRand(seed, salt + i) * Math.PI * 2;
        const r = lobeR * (0.5 + seedRand(seed, salt + i + 100) * 0.6);
        const lx = cx + Math.cos(angle) * r;
        const ly = cy + Math.sin(angle) * r * 0.85;
        const size = 2 + seedRand(seed, salt + i + 200) * 1.1;
        const rot = seedJitter(seed, salt + i + 300, 35);
        return (
            <Leaf
                key={`l-${salt}-${i}`}
                x={lx}
                y={ly}
                rot={rot}
                size={size}
                color={color}
                delay={i * 60}
            />
        );
    });
};

// Une branche catégorisée
const CategoryBranch = ({
    seed,
    index,
    angleBase,
    length,
    thickness,
    color,
    label,
    leaves,
    flowers,
    fruits,
    originX,
    originY,
    showLabel,
    leafColor,
}) => {
    // Angle perturbé par le seed (±10°)
    const angle = angleBase + seedJitter(seed, 100 + index, 10);
    const rad = ((angle - 90) * Math.PI) / 180;

    const tipX = originX + Math.cos(rad) * length;
    const tipY = originY + Math.sin(rad) * length;

    // Point de contrôle Bézier décalé pour un aspect plus organique
    const curveOffset = 3 + seedRand(seed, 200 + index) * 5;
    const midX =
        originX +
        Math.cos(rad) * length * 0.55 +
        Math.cos(rad + Math.PI / 2) * curveOffset;
    const midY =
        originY +
        Math.sin(rad) * length * 0.55 +
        Math.sin(rad + Math.PI / 2) * curveOffset;

    const lobeR = 6 + Math.min(leaves, 14) * 0.55;
    const visibleLeaves = Math.min(leaves, 14);
    const visibleFlowers = Math.min(flowers, 4);
    const visibleFruits = Math.min(fruits, 3);

    const labelDist = lobeR + 5;
    const labelX = tipX + Math.cos(rad) * labelDist;
    const labelY = tipY + Math.sin(rad) * labelDist;
    const labelW = Math.max(label.length * 3.4 + 6, 16);

    return (
        <g>
            <path
                d={`M ${originX} ${originY} Q ${midX} ${midY} ${tipX} ${tipY}`}
                stroke={TRUNK_BASE}
                strokeWidth={thickness}
                fill="none"
                strokeLinecap="round"
                opacity="0.95"
            />
            {/* Lobe doux */}
            <ellipse
                cx={tipX}
                cy={tipY}
                rx={lobeR}
                ry={lobeR * 0.85}
                fill={hexToRgba(color, 0.16)}
            />
            <ellipse
                cx={tipX - 1}
                cy={tipY - 1}
                rx={lobeR * 0.7}
                ry={lobeR * 0.6}
                fill={hexToRgba(color, 0.3)}
            />

            {renderLeavesOnLobe(visibleLeaves, tipX, tipY, lobeR, leafColor, seed, 1000 + index * 50)}

            {Array.from({ length: visibleFlowers }).map((_, i) => {
                const a = seedRand(seed, 2000 + index * 30 + i) * Math.PI * 2;
                const r = lobeR * (0.3 + seedRand(seed, 2050 + index * 30 + i) * 0.4);
                return (
                    <Blossom
                        key={`bf-${index}-${i}`}
                        x={tipX + Math.cos(a) * r}
                        y={tipY + Math.sin(a) * r * 0.8}
                        size={2.4}
                        color={color}
                    />
                );
            })}

            {Array.from({ length: visibleFruits }).map((_, i) => {
                const a = seedRand(seed, 3000 + index * 30 + i) * Math.PI * 2;
                const r = lobeR * 0.45;
                return (
                    <FruitDot
                        key={`bfr-${index}-${i}`}
                        x={tipX + Math.cos(a) * r}
                        y={tipY + Math.sin(a) * r * 0.8 + 1.5}
                        size={2.2}
                    />
                );
            })}

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
    progress = 5,
    season = "Hiver doux",
    leaves = 0,
    roots = 0,
    flowers = 0,
    fruits = 0,
    messageCount = 0,
    categories = null,
    showLabels = true,
    branchShrink = 0,
    seed = "anon",
    className = "",
    breathe = true,
}) => {
    const palette = SEASON_PALETTES[season] || DEFAULT_PALETTE;
    // Teinte des feuilles légèrement décalée par le seed (-10° à +10°)
    const leafColor = shiftHue(palette.leafBase, seedJitter(seed, 10, 10));
    const altLeafColor = shiftHue(palette.leafAlt, seedJitter(seed, 11, 10));

    const hasCategories = Array.isArray(categories) && categories.length >= 1;

    // heightFactor lisse [0, 1] basé sur la progression
    const heightFactor = Math.max(0, Math.min(1, (progress - 5) / 90));

    // Apex du tronc : descend (y plus grand) au début, monte (y plus petit) avec la progression
    const trunkBaseY = 125;
    const trunkApexY = trunkBaseY - 8 - heightFactor * 75;

    // Courbure du tronc : perturbée par le seed (±4px sur l'axe X) pour un aspect organique
    const trunkCurveX = seedJitter(seed, 1, 4);
    const trunkMidX = 60 + trunkCurveX;
    const trunkMidY = trunkBaseY - 8 - heightFactor * 38;

    // Épaisseur du tronc : s'épaissit tous les 10 messages
    const trunkThickness = Math.min(8, 2.4 + Math.floor(messageCount / 10) * 0.6 + heightFactor * 2.2);

    // Origine des branches (point d'apex du tronc)
    const branchOriginY = trunkApexY + 4;
    const branchOriginX = 60;

    const angles = hasCategories ? getBranchAngles(categories.length) : [];

    // Stade graine : on dessine juste la graine sans tronc
    const isSeed = stageKey === "seed" || heightFactor < 0.05;
    const isSeedAwake = stageKey === "seed-awake";

    // Décay : raccourcissement des branches
    const lengthMul = 1 - (branchShrink || 0);

    // Épaisseur des racines : croît avec leur nombre
    const rootThickness = 1.1 + Math.min(roots, 12) * 0.13;
    const rootOpacity = 0.45 + Math.min(roots, 10) * 0.04;

    return (
        <svg
            viewBox="0 0 120 140"
            data-tree-svg="true"
            data-categories={hasCategories ? categories.length : 0}
            data-stage={stageKey}
            className={`${className} ${breathe ? "animate-breathe" : ""}`}
            aria-label={`Ton arbre intérieur — ${stageKey}`}
            role="img"
        >
            <defs>
                <radialGradient id="ground-glow-3" cx="50%" cy="100%" r="60%">
                    <stop offset="0%" stopColor={palette.accent} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Halo de sol coloré par la saison */}
            <ellipse cx="60" cy="128" rx="50" ry="6" fill="url(#ground-glow-3)" />

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

            {/* Racines : s'épaississent avec le nombre de racines */}
            {!isSeed && (
                <g
                    stroke={TRUNK_DEEP}
                    strokeWidth={rootThickness}
                    fill="none"
                    strokeLinecap="round"
                    opacity={rootOpacity}
                >
                    <path d={`M60 125 Q ${48 + seedJitter(seed, 21, 2)} 132 ${36 + seedJitter(seed, 22, 3)} 135`} />
                    <path d={`M60 125 Q ${72 + seedJitter(seed, 23, 2)} 132 ${84 + seedJitter(seed, 24, 3)} 135`} />
                    <path d={`M60 125 Q 60 134 ${58 + seedJitter(seed, 25, 2)} 138`} />
                    {roots > 2 && (
                        <>
                            <path d="M60 125 Q 44 130 28 131" opacity="0.7" />
                            <path d="M60 125 Q 76 130 92 131" opacity="0.7" />
                        </>
                    )}
                    {roots > 5 && (
                        <>
                            <path d="M60 125 Q 40 134 22 137" opacity="0.55" />
                            <path d="M60 125 Q 80 134 98 137" opacity="0.55" />
                        </>
                    )}
                </g>
            )}

            {/* Graine endormie / éveillée */}
            {isSeed && (
                <g>
                    <ellipse cx="60" cy="124" rx="5.5" ry="3.5" fill={TRUNK_BASE} />
                    <ellipse cx="58" cy="123.5" rx="1.4" ry="0.8" fill={TRUNK_DEEP} opacity="0.6" />
                    {isSeedAwake && (
                        <path
                            d="M60 121 Q 61 117 60 113"
                            stroke={leafColor}
                            strokeWidth="1.4"
                            fill="none"
                            strokeLinecap="round"
                            opacity="0.85"
                        />
                    )}
                </g>
            )}

            {/* Tronc Bézier organique */}
            {!isSeed && (
                <>
                    <path
                        d={`M 60 ${trunkBaseY} Q ${trunkMidX} ${trunkMidY} ${branchOriginX} ${trunkApexY}`}
                        stroke={TRUNK_BASE}
                        strokeWidth={trunkThickness}
                        fill="none"
                        strokeLinecap="round"
                    />
                    {/* Ombre du tronc */}
                    <path
                        d={`M 60 ${trunkBaseY} Q ${trunkMidX - 0.8} ${trunkMidY} ${branchOriginX - 0.8} ${trunkApexY}`}
                        stroke={TRUNK_DEEP}
                        strokeWidth={trunkThickness * 0.4}
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.4"
                    />
                </>
            )}

            {/* Halo doux derrière la canopée pour donner du volume */}
            {hasCategories && !isSeed && categories.length > 0 && (
                <circle
                    cx={branchOriginX + seedJitter(seed, 50, 3)}
                    cy={branchOriginY - 6}
                    r={14 + heightFactor * 18}
                    fill={hexToRgba(palette.leafBase, 0.10)}
                />
            )}


            {/* Branches catégorisées */}
            {hasCategories && !isSeed &&
                categories.map((cat, i) => {
                    // Branches initiales (isInitial) → toujours visibles.
                    // Branches custom ajoutées après → invisibles si tagged_count < seuil.
                    const taggedCount = cat.taggedCount || cat.tagged_count || 0;
                    const isInitial = cat.isInitial !== false; // par défaut true
                    if (!isInitial && taggedCount < 5) return null;

                    const angle = angles[i];
                    const total = (cat.leaves || 0) + (cat.flowers || 0) + (cat.fruits || 0);
                    const baseLen = 18 + heightFactor * 14 + Math.min(total, 18) * 0.85;
                    const length = baseLen * lengthMul;
                    const thickness = 1.4 + heightFactor * 0.7 + Math.min(total, 14) * 0.09;
                    return (
                        <CategoryBranch
                            key={cat.id}
                            seed={seed}
                            index={i}
                            angleBase={angle}
                            length={length}
                            thickness={thickness}
                            color={cat.color}
                            label={cat.label}
                            leaves={cat.leaves || 0}
                            flowers={cat.flowers || 0}
                            fruits={cat.fruits || 0}
                            originX={branchOriginX}
                            originY={branchOriginY}
                            showLabel={showLabels && (isInitial || taggedCount >= 5)}
                            leafColor={leafColor}
                        />
                    );
                })}

            {/* Feuilles du tronc (messages sans catégorie ou tronc général) */}
            {!isSeed && leaves > 0 &&
                renderLeavesOnLobe(
                    Math.min(leaves, hasCategories ? 6 : 14),
                    branchOriginX,
                    branchOriginY - 4,
                    hasCategories ? 5 : 14,
                    altLeafColor,
                    seed,
                    9000
                )}

            {/* Fleurs / fruits du tronc */}
            {!isSeed && !hasCategories && flowers > 0 &&
                Array.from({ length: Math.min(flowers, 6) }).map((_, i) => {
                    const a = seedRand(seed, 6000 + i) * Math.PI * 2;
                    const r = 8 + seedRand(seed, 6050 + i) * 8;
                    return (
                        <Blossom
                            key={`tf-${i}`}
                            x={branchOriginX + Math.cos(a) * r}
                            y={branchOriginY - 4 + Math.sin(a) * r * 0.7}
                            size={2.5}
                            color={palette.accent}
                        />
                    );
                })}
            {!isSeed && !hasCategories && fruits > 0 &&
                Array.from({ length: Math.min(fruits, 5) }).map((_, i) => {
                    const a = seedRand(seed, 7000 + i) * Math.PI * 2;
                    const r = 8 + seedRand(seed, 7050 + i) * 6;
                    return (
                        <FruitDot
                            key={`tfr-${i}`}
                            x={branchOriginX + Math.cos(a) * r}
                            y={branchOriginY - 2 + Math.sin(a) * r * 0.7}
                            size={2.4}
                        />
                    );
                })}
        </svg>
    );
};
