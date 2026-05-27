// Logique d'évolution de l'arbre intérieur.
// L'arbre ne meurt jamais. Pas de streak. Pas de culpabilisation.

import { CRISIS_PHRASES } from "./responses";

export function getStageFromCount(count) {
    if (count > 9) {
        return {
            stage: "Arbre vivant",
            progress: 90,
            season: "Automne lumineux",
            key: "alive",
        };
    }
    if (count > 5) {
        return {
            stage: "Arbre en croissance",
            progress: 65,
            season: "Été calme",
            key: "growing",
        };
    }
    if (count > 2) {
        return {
            stage: "Jeune pousse",
            progress: 35,
            season: "Printemps",
            key: "sprout",
        };
    }
    return {
        stage: "Graine endormie",
        progress: 5,
        season: "Hiver doux",
        key: "seed",
    };
}

// Normalisation simple (minuscules + retrait accents) pour la détection de crise.
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

// Met à jour les statistiques de l'arbre quand l'utilisateur envoie un message.
// - Si categoryId est fourni : la croissance va sur la branche concernée.
// - Sinon : la croissance va sur les stats "tronc" globales.
// Retourne { trunk, categories, growthEvents }
export function computeGrowth(prevTrunk, prevCategories, mode, messageCount, categoryId) {
    const events = [];
    const trunk = { ...prevTrunk };
    const categories = (prevCategories || []).map((c) => ({ ...c }));

    const targetIdx = categoryId
        ? categories.findIndex((c) => c.id === categoryId)
        : -1;

    const target = targetIdx >= 0 ? categories[targetIdx] : null;
    const targetLabel = target?.label;

    // Une feuille à chaque message utilisateur
    if (target) {
        target.leaves += 1;
        events.push(`Une feuille a poussé sur la branche ${targetLabel}.`);
    } else {
        trunk.leaves += 1;
        events.push("Une feuille a poussé sur ton tronc.");
    }

    // Une racine toutes les 3 conversations (toujours sur le tronc, car les racines
    // sont une fondation transversale).
    if (messageCount % 3 === 0 && messageCount > 0) {
        trunk.roots += 1;
        events.push("Une racine s'est renforcée.");
    }

    // Bilan de journée → ajoute une fleur
    if (mode === "daily") {
        if (target) {
            target.flowers += 1;
            events.push(`Une fleur s'est ouverte sur ${targetLabel}.`);
        } else {
            trunk.flowers += 1;
            events.push("Une fleur s'est ouverte.");
        }
    }

    // Je rumine + plus de 2 messages → ajoute un fruit
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

// Somme totale pour affichage : trunk + toutes catégories
export function aggregateStats(trunk, categories) {
    const cats = categories || [];
    return {
        leaves: trunk.leaves + cats.reduce((s, c) => s + c.leaves, 0),
        roots: trunk.roots, // les racines restent globales
        flowers: trunk.flowers + cats.reduce((s, c) => s + c.flowers, 0),
        fruits: trunk.fruits + cats.reduce((s, c) => s + c.fruits, 0),
    };
}
