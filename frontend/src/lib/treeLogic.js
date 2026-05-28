// Logique d'évolution de l'arbre intérieur.
// - 10 stades de croissance progressive.
// - 1 feuille par 2 messages utilisateur (croissance lente).
// - Le tronc s'épaissit tous les 10 messages.
// - Une nouvelle branche (catégorie ajoutée APRÈS l'onboarding) n'apparaît
//   visuellement qu'après 5 messages tagués dessus. Les branches initiales
//   sont visibles dès le départ.
// - Décay VISUEL (jamais destructif) en cas d'absence prolongée.

import { CRISIS_PHRASES } from "./responses";

const STAGES = [
    { min: 0, stage: "Graine endormie", season: "Hiver doux", key: "seed", progress: 5 },
    { min: 2, stage: "Graine éveillée", season: "Hiver doux", key: "seed-awake", progress: 12 },
    { min: 4, stage: "Première pousse", season: "Printemps", key: "first-shoot", progress: 20 },
    { min: 8, stage: "Jeune pousse", season: "Printemps", key: "sprout", progress: 32 },
    { min: 14, stage: "Petite tige", season: "Printemps", key: "stem", progress: 42 },
    { min: 22, stage: "Plant adolescent", season: "Été calme", key: "young", progress: 54 },
    { min: 32, stage: "Jeune arbre", season: "Été calme", key: "growing", progress: 65 },
    { min: 44, stage: "Arbre établi", season: "Été calme", key: "established", progress: 75 },
    { min: 60, stage: "Arbre robuste", season: "Automne lumineux", key: "robust", progress: 85 },
    { min: 80, stage: "Arbre vivant", season: "Automne lumineux", key: "alive", progress: 95 },
];

// Combien de messages avant qu'une branche ajoutée APRÈS l'onboarding ne devienne visible
export const NEW_BRANCH_THRESHOLD = 5;

export function getStageFromCount(count) {
    let result = STAGES[0];
    for (const s of STAGES) {
        if (count >= s.min) result = s;
    }
    return result;
}

// Normalisation accents/casse pour la détection de crise.
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, " ");
}

export function detectCrisis(text) {
    if (!text) return false;
    const norm = normalize(text);
    return CRISIS_PHRASES.some((phrase) => norm.includes(phrase));
}

// Croissance : on ajoute une feuille uniquement aux messages pairs (1 toutes les 2).
// Les autres règles (racines, fleurs, fruits) restent associées au message.
export function computeGrowth(prevTrunk, prevCategories, mode, messageCount, categoryId) {
    const events = [];
    const trunk = { ...prevTrunk };
    const categories = (prevCategories || []).map((c) => ({ ...c }));

    const targetIdx = categoryId
        ? categories.findIndex((c) => c.id === categoryId)
        : -1;

    // Si on a une catégorie cible, incrémenter son taggedCount à chaque message tagué.
    if (targetIdx >= 0) {
        const cat = categories[targetIdx];
        cat.taggedCount = (cat.taggedCount || 0) + 1;
        categories[targetIdx] = cat;
    }

    const target = targetIdx >= 0 ? categories[targetIdx] : null;
    const targetLabel = target?.label;

    // Feuille : 1 toutes les 2 conversations utilisateur
    if (messageCount % 2 === 0 && messageCount > 0) {
        if (target) {
            target.leaves += 1;
            events.push(`Une feuille a poussé sur la branche ${targetLabel}.`);
        } else {
            trunk.leaves += 1;
            events.push("Une feuille a poussé sur ton tronc.");
        }
    }

    // Racine : tous les 3 messages, toujours globale
    if (messageCount > 0 && messageCount % 3 === 0) {
        trunk.roots += 1;
        events.push("Une racine s'est renforcée.");
    }

    // Fleur en mode Bilan (à chaque message du mode)
    if (mode === "daily") {
        if (target) {
            target.flowers += 1;
            events.push(`Une fleur s'est ouverte sur ${targetLabel}.`);
        } else {
            trunk.flowers += 1;
            events.push("Une fleur s'est ouverte.");
        }
    }

    // Fruit en mode Je rumine après 2 messages
    if (mode === "rumination" && messageCount > 2) {
        if (target) {
            target.fruits += 1;
            events.push(`Un fruit est apparu sur ${targetLabel}.`);
        } else {
            trunk.fruits += 1;
            events.push("Un fruit est apparu.");
        }
    }

    if (target) categories[targetIdx] = target;

    return { trunk, categories, growthEvents: events };
}

// Agrégation pour l'affichage des stats globales
export function aggregateStats(trunk, categories) {
    const cats = categories || [];
    return {
        leaves: trunk.leaves + cats.reduce((s, c) => s + (c.leaves || 0), 0),
        roots: trunk.roots,
        flowers: trunk.flowers + cats.reduce((s, c) => s + (c.flowers || 0), 0),
        fruits: trunk.fruits + cats.reduce((s, c) => s + (c.fruits || 0), 0),
    };
}

// Combien de jours pleins se sont écoulés depuis le dernier message
export function daysSince(isoDate) {
    if (!isoDate) return 0;
    const t = new Date(isoDate).getTime();
    if (Number.isNaN(t)) return 0;
    const diffMs = Date.now() - t;
    return Math.max(0, Math.floor(diffMs / 86400000));
}

// Decay visuel : on retourne des stats "affichage" qui peuvent être inférieures
// aux stats réelles. Les vraies stats stockées ne sont JAMAIS modifiées.
// Règles :
//   > 2 jours : -1 feuille par jour d'absence (min 0)
//   > 5 jours : fleurs cachées
//   > 10 jours : raccourcissement visuel des branches de 20%
export function applyDecayToTrunk(trunk, days) {
    if (days <= 2) return trunk;
    const lostLeaves = days - 2;
    return {
        ...trunk,
        leaves: Math.max(0, trunk.leaves - lostLeaves),
        flowers: days > 5 ? 0 : trunk.flowers,
    };
}

export function applyDecayToCategories(cats, days) {
    if (!cats || days <= 2) return cats || [];
    const lostLeaves = days - 2;
    return cats.map((c) => ({
        ...c,
        leaves: Math.max(0, (c.leaves || 0) - lostLeaves),
        flowers: days > 5 ? 0 : c.flowers || 0,
    }));
}

export function getBranchShrink(days) {
    return days > 10 ? 0.2 : 0;
}

// Message d'accueil selon la dernière visite
export function getReturningMessage(days) {
    if (days < 1) return null;
    if (days <= 1) return "Content de te revoir.";
    if (days <= 3) return "Tu m'as manqué. Comment s'est passé ce temps ?";
    return "L'arbre a attendu. Il est encore là.";
}

export function getDecayCopy(days) {
    if (days <= 2) return null;
    if (days <= 5) return "Ton jardin a besoin de toi.";
    if (days <= 10) return "Quelques feuilles se sont posées. Reviens quand tu veux.";
    return "L'arbre est en hivernage. Tu peux le réveiller doucement.";
}
