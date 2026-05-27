// Catégories — branches de l'arbre intérieur.
// Palette douce et harmonieuse, pensée pour un jardin organique
// (jamais de couleur agressive ni saturée).

export const CATEGORY_PALETTE = [
    "#7B8AA0", // bleu-gris doux
    "#C07C66", // terre cuite
    "#88A89D", // verveine
    "#C09A5C", // ocre doux
    "#6F7860", // sauge profond
    "#9B7B8E", // mauve sourde
];

export const DEFAULT_CATEGORIES = [
    { id: "work", label: "Travail", color: "#7B8AA0", preselected: true },
    { id: "relations", label: "Relations", color: "#C07C66", preselected: true },
    { id: "health", label: "Santé", color: "#88A89D", preselected: true },
    { id: "family", label: "Famille", color: "#C09A5C", preselected: false },
    { id: "projects", label: "Projets", color: "#6F7860", preselected: false },
    { id: "self", label: "Soi", color: "#9B7B8E", preselected: true },
];

export const MIN_CATEGORIES = 3;
export const MAX_CATEGORIES = 6;

// Création d'une catégorie vierge — pour la stocker côté app on garde stats.
export const makeCategoryStat = (cat) => ({
    id: cat.id,
    label: cat.label,
    color: cat.color,
    leaves: 0,
    flowers: 0,
    fruits: 0,
});

// Distribue les angles des branches dans un arc supérieur de ~160°.
// Retourne un tableau d'angles (en degrés depuis la verticale, positifs vers la droite).
export const getBranchAngles = (n) => {
    if (n <= 0) return [];
    if (n === 1) return [0];
    const span = 160;
    const start = -span / 2;
    return Array.from({ length: n }, (_, i) => start + (span * i) / (n - 1));
};
