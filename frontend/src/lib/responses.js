// Banque de réponses simulées pour chaque mode d'écoute.
// Le ton est inspiré d'un journal intime et d'un confident bienveillant.
// Aucune de ces réponses ne se présente comme thérapeute ou médecin.

export const MODE_RESPONSES = {
    free: [
        "Je comprends. Peux-tu m'en dire un peu plus sur ce qui a déclenché cela ?",
        "Merci de le déposer ici. Qu'est-ce qui te pèse le plus dans ce que tu viens d'écrire ?",
        "Je t'écoute. On peut avancer doucement, phrase par phrase.",
        "Ce que tu décris semble important. Qu'aimerais-tu comprendre en priorité ?",
        "Tu n'as pas besoin de tout organiser tout de suite. On peut simplement commencer par ce que tu ressens.",
        "Prends ton temps. Il n'y a aucune urgence ici.",
        "Ce que tu nommes, c'est déjà un premier pas. Veux-tu qu'on s'y arrête un instant ?",
    ],
    daily: [
        "Si tu devais garder une seule image de cette journée, ce serait laquelle ?",
        "Qu'est-ce qui t'a demandé le plus d'énergie aujourd'hui ?",
        "Y a-t-il eu un petit moment, même discret, qui t'a fait du bien ?",
        "Qu'aimerais-tu laisser derrière toi ce soir ?",
        "Qu'est-ce que cette journée t'a appris sur toi ?",
        "S'il fallait remercier ta journée pour une chose, qu'est-ce que ce serait ?",
    ],
    rumination: [
        "On peut séparer les faits, les interprétations et les peurs. Quel est le fait certain ici ?",
        "Cette pensée revient souvent. Qu'essaie-t-elle peut-être de protéger en toi ?",
        "Quelle serait une explication alternative, même imparfaite ?",
        "Qu'est-ce qui dépend réellement de toi dans cette situation ?",
        "Si un ami vivait la même chose, que lui dirais-tu ?",
        "Et si on essayait de la formuler autrement, plus doucement ?",
    ],
    light: [
        "On peut parler simplement. Qu'est-ce qui t'a traversé l'esprit aujourd'hui ?",
        "D'accord, restons léger. Tu veux parler d'un film, d'un souvenir, d'une envie ou d'un projet ?",
        "Parfois, discuter de petites choses fait déjà du bien.",
        "Je suis là aussi pour les conversations sans enjeu.",
        "Alors, si ta journée avait une couleur, ce serait laquelle ?",
        "Raconte-moi quelque chose de doux ou d'amusant, sans pression.",
    ],
};

// Réponses d'ouverture par mode (premier message quand on change de mode)
export const MODE_OPENERS = {
    free: "Bonjour. Je suis là pour t'écouter, sans jugement. Comment te sens-tu en ce moment ?",
    daily: "Prenons un moment ensemble. Qu'est-ce que tu retiens de ta journée ?",
    rumination: "Il y a une pensée qui tourne en boucle ? Pose-la ici, on va l'apprivoiser doucement.",
    light: "Pas d'enjeu ce soir. De quoi as-tu envie de parler ?",
};

export const MODE_LABELS = {
    free: "Conversation libre",
    daily: "Bilan de journée",
    rumination: "Je rumine",
    light: "Conversation légère",
};

export const MODE_SUBTITLES = {
    free: "Un espace pour déposer ce que tu portes.",
    daily: "Un moment pour faire le tri, sans pression.",
    rumination: "On va ralentir la pensée, ensemble.",
    light: "Une parenthèse douce, sans enjeu.",
};

export const MODE_PLACEHOLDERS = {
    free: "Qu'est-ce que tu aimerais déposer ici ?",
    daily: "Qu'est-ce que tu retiens de ta journée ?",
    rumination: "Quelle pensée tourne en boucle ?",
    light: "De quoi as-tu envie de parler ?",
};

// Mots-clés / expressions de crise (insensible à la casse, normalisé sans accents)
export const CRISIS_PHRASES = [
    "suicide",
    "me suicider",
    "suicider",
    "mourir",
    "envie de mourir",
    "je veux en finir",
    "en finir",
    "me faire du mal",
    "automutilation",
    "je ne veux plus vivre",
    "ne plus vivre",
    "disparaitre",
    "j ai un plan",
    "passer a l acte",
];

export const CRISIS_MESSAGE =
    "Je suis vraiment désolé que tu traverses ça. Ce que tu écris mérite une aide humaine immédiate. Si tu es en danger ou que tu risques de te faire du mal, contacte les urgences maintenant. En France, tu peux appeler le 3114, gratuitement, 24h/24 et 7j/7. Tu n'as pas à rester seul avec ça.";

// Données mockées pour la page « Mon évolution »
export const MOCK_THEMES = [
    { label: "Charge mentale", weight: 0.32 },
    { label: "Relations proches", weight: 0.24 },
    { label: "Sommeil", weight: 0.18 },
    { label: "Estime de soi", weight: 0.14 },
    { label: "Projets & sens", weight: 0.12 },
];

export const MOCK_FRUITS = [
    "J'ai compris ce qui me pesait.",
    "J'ai identifié un besoin de repos.",
    "J'ai transformé une inquiétude en petite action.",
    "J'ai mis des mots sur une émotion floue.",
    "J'ai osé ralentir un instant.",
];

export const SOFT_MICROCOPY = [
    "Ton arbre grandit à ton rythme.",
    "Tu as pris du temps pour toi.",
    "Même en hiver, ton arbre continue d'exister.",
    "Tu peux revenir doucement.",
    "Tu n'as rien à prouver ici.",
    "Ce lieu est un espace d'écoute, pas de performance.",
];
