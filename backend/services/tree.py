"""Logique de croissance de l'arbre intérieur.

Réplique de la logique frontend, centralisée côté serveur pour permettre
des évolutions sans redéploiement front.

Règles :
- 1 feuille par message utilisateur.
- 1 racine tous les 3 messages (toujours sur le tronc).
- Mode "daily" → +1 fleur.
- Mode "rumination" + count > 2 → +1 fruit.
- Si un categoryId est fourni : la croissance va sur la branche correspondante.
  Sinon : sur le tronc général.
"""

from __future__ import annotations


STAGE_RULES = [
    (9, {"stage": "Arbre vivant", "progress": 90, "season": "Automne lumineux", "key": "alive"}),
    (5, {"stage": "Arbre en croissance", "progress": 65, "season": "Été calme", "key": "growing"}),
    (2, {"stage": "Jeune pousse", "progress": 35, "season": "Printemps", "key": "sprout"}),
    (-1, {"stage": "Graine endormie", "progress": 5, "season": "Hiver doux", "key": "seed"}),
]


def stage_from_count(count: int) -> dict:
    for threshold, meta in STAGE_RULES:
        if count > threshold:
            return meta
    return STAGE_RULES[-1][1]


def compute_growth(
    prev_trunk: dict,
    prev_categories: list[dict] | None,
    mode: str,
    message_count: int,
    category_id: str | None,
) -> dict:
    events: list[str] = []
    trunk = dict(prev_trunk)
    trunk.setdefault("leaves", 0)
    trunk.setdefault("roots", 0)
    trunk.setdefault("flowers", 0)
    trunk.setdefault("fruits", 0)

    categories = [dict(c) for c in (prev_categories or [])]

    target_idx = -1
    if category_id:
        for i, c in enumerate(categories):
            if c.get("id") == category_id:
                target_idx = i
                break

    target = categories[target_idx] if target_idx >= 0 else None
    target_label = target.get("label") if target else None

    # Feuille
    if target is not None:
        target["leaves"] = target.get("leaves", 0) + 1
        events.append(f"Une feuille a poussé sur la branche {target_label}.")
    else:
        trunk["leaves"] += 1
        events.append("Une feuille a poussé sur ton tronc.")

    # Racine globale toutes les 3 conversations
    if message_count > 0 and message_count % 3 == 0:
        trunk["roots"] += 1
        events.append("Une racine s'est renforcée.")

    # Fleur en mode Bilan
    if mode == "daily":
        if target is not None:
            target["flowers"] = target.get("flowers", 0) + 1
            events.append(f"Une fleur s'est ouverte sur {target_label}.")
        else:
            trunk["flowers"] += 1
            events.append("Une fleur s'est ouverte.")

    # Fruit en mode Je rumine après 2 messages
    if mode == "rumination" and message_count > 2:
        if target is not None:
            target["fruits"] = target.get("fruits", 0) + 1
            events.append(f"Un fruit est apparu sur {target_label}.")
        else:
            trunk["fruits"] += 1
            events.append("Un fruit est apparu.")

    if target is not None:
        categories[target_idx] = target

    stage = stage_from_count(message_count)

    return {
        "trunk": trunk,
        "categories": categories,
        "growth_events": events,
        "stage": stage,
        "branch_grown": target.get("id") if target else None,
    }
