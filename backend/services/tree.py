"""Logique de croissance de l'arbre intérieur — version 2.

10 stades progressifs. Une feuille tous les 2 messages utilisateur.
Le tronc s'épaissit tous les 10 messages (côté frontend, calculé à partir
du messageCount). Les catégories conservent un compteur tagged_count.
"""

from __future__ import annotations


STAGES = [
    {"min": 0, "stage": "Graine endormie", "season": "Hiver doux", "key": "seed", "progress": 5},
    {"min": 2, "stage": "Graine éveillée", "season": "Hiver doux", "key": "seed-awake", "progress": 12},
    {"min": 4, "stage": "Première pousse", "season": "Printemps", "key": "first-shoot", "progress": 20},
    {"min": 8, "stage": "Jeune pousse", "season": "Printemps", "key": "sprout", "progress": 32},
    {"min": 14, "stage": "Petite tige", "season": "Printemps", "key": "stem", "progress": 42},
    {"min": 22, "stage": "Plant adolescent", "season": "Été calme", "key": "young", "progress": 54},
    {"min": 32, "stage": "Jeune arbre", "season": "Été calme", "key": "growing", "progress": 65},
    {"min": 44, "stage": "Arbre établi", "season": "Été calme", "key": "established", "progress": 75},
    {"min": 60, "stage": "Arbre robuste", "season": "Automne lumineux", "key": "robust", "progress": 85},
    {"min": 80, "stage": "Arbre vivant", "season": "Automne lumineux", "key": "alive", "progress": 95},
]


def stage_from_count(count: int) -> dict:
    result = STAGES[0]
    for s in STAGES:
        if count >= s["min"]:
            result = s
    return result


def _find_target(categories: list[dict], category_id: str | None) -> tuple[int, dict | None]:
    if not category_id:
        return -1, None
    for i, c in enumerate(categories):
        if c.get("id") == category_id:
            return i, c
    return -1, None


def _ensure_stats(d: dict) -> dict:
    d.setdefault("leaves", 0)
    d.setdefault("roots", 0)
    d.setdefault("flowers", 0)
    d.setdefault("fruits", 0)
    return d


def _add_leaf(target: dict | None, trunk: dict, label: str | None, events: list[str]) -> None:
    if target is not None:
        target["leaves"] = target.get("leaves", 0) + 1
        events.append(f"Une feuille a poussé sur la branche {label}.")
    else:
        trunk["leaves"] += 1
        events.append("Une feuille a poussé sur ton tronc.")


def _add_flower(target: dict | None, trunk: dict, label: str | None, events: list[str]) -> None:
    if target is not None:
        target["flowers"] = target.get("flowers", 0) + 1
        events.append(f"Une fleur s'est ouverte sur {label}.")
    else:
        trunk["flowers"] += 1
        events.append("Une fleur s'est ouverte.")


def _add_fruit(target: dict | None, trunk: dict, label: str | None, events: list[str]) -> None:
    if target is not None:
        target["fruits"] = target.get("fruits", 0) + 1
        events.append(f"Un fruit est apparu sur {label}.")
    else:
        trunk["fruits"] += 1
        events.append("Un fruit est apparu.")


def compute_growth(
    prev_trunk: dict,
    prev_categories: list[dict] | None,
    mode: str,
    message_count: int,
    category_id: str | None,
) -> dict:
    events: list[str] = []
    trunk = _ensure_stats(dict(prev_trunk))
    categories = [dict(c) for c in (prev_categories or [])]

    target_idx, target = _find_target(categories, category_id)

    # Incrément du compteur tagged_count si on a une cible
    if target is not None:
        target["tagged_count"] = target.get("tagged_count", 0) + 1

    label = target.get("label") if target else None

    # Feuille toutes les 2 conversations
    if message_count > 0 and message_count % 2 == 0:
        _add_leaf(target, trunk, label, events)

    # Racine toutes les 3 conversations (globale)
    if message_count > 0 and message_count % 3 == 0:
        trunk["roots"] += 1
        events.append("Une racine s'est renforcée.")

    # Fleur en mode Bilan
    if mode == "daily":
        _add_flower(target, trunk, label, events)

    # Fruit en mode Je rumine après 2 messages
    if mode == "rumination" and message_count > 2:
        _add_fruit(target, trunk, label, events)

    if target is not None:
        categories[target_idx] = target

    return {
        "trunk": trunk,
        "categories": categories,
        "growth_events": events,
        "stage": stage_from_count(message_count),
        "branch_grown": target.get("id") if target else None,
    }
