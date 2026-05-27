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
// Retourne { newStats, growthEvents: string[] }
export function computeGrowth(prev, mode, messageCount) {
    const events = [];
    const next = { ...prev };

    // Une feuille à chaque message utilisateur
    next.leaves = prev.leaves + 1;
    events.push("Une feuille a poussé.");

    // Une racine toutes les 3 conversations utilisateur
    if (messageCount % 3 === 0 && messageCount > 0) {
        next.roots = prev.roots + 1;
        events.push("Une racine s'est renforcée.");
    }

    // Bilan de journée → ajoute une fleur
    if (mode === "daily") {
        next.flowers = prev.flowers + 1;
        events.push("Une fleur s'est ouverte.");
    }

    // Je rumine + plus de 2 messages → ajoute un fruit
    if (mode === "rumination" && messageCount > 2) {
        next.fruits = prev.fruits + 1;
        events.push("Un fruit est apparu.");
    }

    return { newStats: next, growthEvents: events };
}
