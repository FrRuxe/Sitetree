// Identité visuelle unique de l'utilisateur.
// On stocke un userId généré au premier lancement et on s'en sert comme
// seed pour les paramètres visuels de l'arbre (angles, courbure du tronc,
// teinte des feuilles). Deux utilisateurs avec le même nombre de messages
// auront ainsi des arbres visuellement distincts.

const USER_ID_KEY = "jardin-interieur-user-id-v1";

const generateUuid = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback minimal (rare)
    return "uid-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
};

export function getUserId() {
    try {
        let id = localStorage.getItem(USER_ID_KEY);
        if (!id) {
            id = generateUuid();
            localStorage.setItem(USER_ID_KEY, id);
        }
        return id;
    } catch {
        return "anon";
    }
}

// Hash déterministe d'une chaîne avec un sel entier.
function hashSeed(seed, salt = 0) {
    let h = salt;
    const s = String(seed || "anon");
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

// Génère une valeur pseudo-aléatoire déterministe ∈ [0, 1)
// pour un couple (seed, salt) donné.
export function seedRand(seed, salt = 0) {
    const v = Math.sin(hashSeed(seed, salt) * 12.9898 + salt * 78.233) * 43758.5453;
    return v - Math.floor(v);
}

// Renvoie une valeur centrée autour de 0, ∈ [-amp, +amp].
export function seedJitter(seed, salt = 0, amp = 1) {
    return (seedRand(seed, salt) - 0.5) * 2 * amp;
}
