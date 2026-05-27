"""Détection de la branche / catégorie probable d'un message utilisateur.

Approche entièrement locale et déterministe : on cherche des mots-clés associés
à chaque catégorie. Si la catégorie est personnalisée (label libre), on génère
des mots-clés à partir du label lui-même.

Si plusieurs catégories matchent, on retourne celle qui a le plus haut score
pondéré. Si aucune catégorie ne matche, on retourne None.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Iterable

# Mots-clés associés aux catégories par défaut.
# Toutes les entrées doivent être en minuscules sans accents (cf. _norm).
DEFAULT_KEYWORDS: dict[str, list[str]] = {
    "work": [
        "travail", "boulot", "bureau", "collegue", "collegues", "patron",
        "manager", "boss", "reunion", "deadline", "projet pro", "client",
        "entreprise", "carriere", "burn out", "burnout", "metier", "job",
        "salaire", "promotion", "demission", "licenciement", "open space",
        "teletravail", "remote", "horaires", "surcharge", "charge mentale",
        "presentation",
    ],
    "relations": [
        "ami", "amie", "amis", "amies", "copain", "copine", "amoureux",
        "amoureuse", "couple", "petit ami", "petite amie", "conjoint",
        "conjointe", "compagnon", "compagne", "partenaire", "rupture",
        "dispute", "conflit", "trahison", "confiance", "intimite", "ex",
        "rencontre", "relation", "lien", "social", "solitude", "seul",
        "seule", "isolement", "voisin", "voisine",
    ],
    "health": [
        "sante", "fatigue", "epuise", "epuisee", "epuisement", "sommeil",
        "dormir", "insomnie", "douleur", "mal au", "corps", "repos",
        "sport", "exercice", "alimentation", "manger", "appetit", "poids",
        "regime", "medecin", "traitement", "medicament", "anxiete", "stress",
        "tension", "respirer", "souffle", "energie", "vertige", "migraine",
    ],
    "family": [
        "famille", "mere", "maman", "pere", "papa", "parents", "frere",
        "soeur", "fratrie", "enfant", "enfants", "fils", "fille",
        "grand mere", "grand pere", "grands parents", "tante", "oncle",
        "cousin", "cousine", "neveu", "niece", "belle mere", "beau pere",
        "education", "filiation",
    ],
    "projects": [
        "projet", "objectif", "but", "ambition", "creer", "lancer", "idee",
        "envie", "reve", "plan", "vision", "demarrer", "construire",
        "ecrire", "apprendre", "etudier", "formation", "etudes", "examen",
        "diplome", "passion", "creation", "art", "musique", "ecriture",
        "lecture", "voyage",
    ],
    "self": [
        "moi", "soi", "identite", "valeur", "valeurs", "sens", "peur",
        "peurs", "doute", "doutes", "confiance en soi", "estime",
        "introspection", "spiritualite", "meditation", "ressentir", "emotion",
        "emotions", "tristesse", "joie", "colere", "honte", "culpabilite",
        "vide", "plein", "presence", "conscience", "interieur", "interieure",
        "qui je suis", "ce que je suis", "qui je veux etre",
    ],
}


def _norm(text: str) -> str:
    """Minuscules + retrait accents + apostrophes → espace + espaces unifiés."""
    if not text:
        return ""
    t = unicodedata.normalize("NFD", text.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.replace("'", " ").replace("\u2019", " ")
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _label_keywords(label: str) -> list[str]:
    """Génère des mots-clés à partir du label d'une catégorie personnalisée :
    le label lui-même + tokens individuels de plus de 3 lettres.
    """
    base = _norm(label)
    if not base:
        return []
    tokens = [t for t in base.split() if len(t) > 3]
    out = [base] + tokens
    # déduplication en gardant l'ordre
    return list(dict.fromkeys(out))


def _keywords_for(category: dict) -> list[str]:
    """Retourne les mots-clés pour une catégorie : prédéfinis si id connu,
    sinon dérivés du label."""
    cat_id = category.get("id", "")
    if cat_id in DEFAULT_KEYWORDS:
        return DEFAULT_KEYWORDS[cat_id]
    return _label_keywords(category.get("label", ""))


def _score(text_norm: str, keywords: Iterable[str]) -> int:
    """Compte le nombre d'occurrences de mots-clés (mots ou expressions)
    dans le texte normalisé. Les expressions de plusieurs mots comptent double."""
    score = 0
    for kw in keywords:
        if not kw:
            continue
        # Recherche en limite de mot pour les keywords simples
        if " " in kw:
            if kw in text_norm:
                score += 2
        else:
            if re.search(rf"\b{re.escape(kw)}\b", text_norm):
                score += 1
    return score


def detect_branch(text: str, categories: list[dict]) -> dict | None:
    """Renvoie le dict { branch_id, confidence } ou None.

    confidence ∈ [0, 1] (très grossier — on l'utilise surtout pour décider si
    on auto-suggère).
    """
    if not text or not categories:
        return None
    norm = _norm(text)
    if not norm:
        return None

    best: tuple[int, dict | None] = (0, None)
    total = 0
    for cat in categories:
        kws = _keywords_for(cat)
        s = _score(norm, kws)
        total += s
        if s > best[0]:
            best = (s, cat)

    if best[0] == 0 or best[1] is None:
        return None

    # Confidence très simple : score relatif au total
    confidence = best[0] / max(total, 1)
    return {
        "branch_id": best[1]["id"],
        "label": best[1].get("label", ""),
        "confidence": round(confidence, 2),
        "score": best[0],
    }
