"""Détection de signaux de crise dans le texte utilisateur.

Volontairement permissif sur la frappe : tolérance aux accents et à la casse,
mais évite les faux positifs grossiers (ex: "je vais mal" tout seul ne déclenche pas).
"""

from __future__ import annotations

import re
import unicodedata

# Expressions précises (déjà normalisées en minuscules sans accents)
CRISIS_PHRASES = [
    "suicide",
    "me suicider",
    "suicider",
    "envie de mourir",
    "veux mourir",
    "je veux en finir",
    "en finir avec la vie",
    "en finir",
    "me faire du mal",
    "faire du mal",
    "automutilation",
    "je ne veux plus vivre",
    "ne veux plus vivre",
    "ne plus vivre",
    "veux disparaitre",
    "j ai un plan",
    "passer a l acte",
    "me tuer",
    "tuer",
]


def normalize(text: str) -> str:
    """Minuscules + retrait des accents + apostrophes → espace."""
    if not text:
        return ""
    t = unicodedata.normalize("NFD", text.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.replace("'", " ").replace("\u2019", " ")
    t = re.sub(r"\s+", " ", t)
    return t


def detect_crisis(text: str) -> bool:
    """Renvoie True si un signal de crise est détecté."""
    norm = normalize(text)
    return any(phrase in norm for phrase in CRISIS_PHRASES)


CRISIS_MESSAGE = (
    "Je suis vraiment désolé que tu traverses ça. Ce que tu écris mérite une aide "
    "humaine immédiate. Si tu es en danger ou que tu risques de te faire du mal, "
    "contacte les urgences maintenant. En France, tu peux appeler le 3114, "
    "gratuitement, 24h/24 et 7j/7. Tu n'as pas à rester seul avec ça."
)
