# Jardin Intérieur — PRD

## Problème / Vision
SPA prototype « Jardin Intérieur » : assistant de soutien émotionnel bienveillant (jamais médical), journal conversationnel, arbre intérieur qui évolue avec les conversations. Front-end React/Tailwind/lucide-react uniquement, données mockées, aucune API externe. Inspiration visuelle : Claude d'Anthropic + carnet intime.

## Personas
- **L'utilisateur en rumination** : besoin de déposer une pensée qui tourne en boucle.
- **L'utilisateur en bilan** : besoin de faire le point sur sa journée.
- **L'utilisateur en quête de présence** : conversation libre, sans enjeu.
- **L'utilisateur en détresse** : doit être redirigé vers une aide humaine (3114) sans alarmisme.

## Choix utilisateur (validés)
- Architecture : App.js + composants séparés dans `/components`.
- Stockage : localStorage (option future « Cloud chiffré » affichée comme Bientôt).
- Page « Mon évolution » : modal overlay.
- Police serif IA : **Source Serif 4** (proche de l'identité Claude). Sans-serif UI : **Inter**.

## Design system (strict)
- Background : `#FAF9F6` (jamais blanc pur).
- Sidebar : `#F0EBE1`.
- Texte : `#2B2B2B` / `text-stone-800` (jamais noir pur).
- Accent arbre (sage) : `#8F9779`.
- Accent terre cuite : `#C07C66`.
- Urgence : rose désaturé `#9F3645` sur `#FBF1F1`.
- Bordures `rounded-2xl` / `rounded-3xl`, shadows discrets, espacement généreux.

## Architecture
- `App.js` — état global, persistance localStorage (lazy init), gestion crise/croissance.
- `lib/responses.js` — banques de réponses par mode, openers, placeholders, microcopy, crisis phrases, mock data évolution.
- `lib/treeLogic.js` — `getStageFromCount`, `detectCrisis` (normalisation accents), `computeGrowth`.
- `components/` — Sidebar, ModeSelector, TreeWidget (SVG arbre 4 stades), ChatArea, MessageBubble, ChatInput, EmergencySupportCard, LocalSettingsPanel, InnerGardenEvolution, GrowthToast.

## Implémenté (27/02/2026)
- 4 modes d'écoute (Conversation libre / Bilan de journée / Je rumine / Conversation légère) avec placeholders, sous-titres, banques de réponses dédiées.
- Chat conversationnel mocké avec indicateur « Luma écrit… », délai 1.5-2s.
- Arbre intérieur SVG évoluant en 4 stades selon `messageCount` : Graine endormie / Jeune pousse / Arbre en croissance / Arbre vivant. Saisons émotionnelles.
- Croissance : +1 feuille par message, +1 racine tous les 3 messages, +1 fleur en mode Bilan, +1 fruit en mode Je rumine après 2 messages. Toast doux « Une feuille a poussé ».
- Détection de crise insensible accents/casse (suicide, mourir, en finir, me faire du mal, automutilation, disparaître, j'ai un plan, etc.). Carte rose avec 3114, ressources (15/112, SOS Amitié, Fil Santé Jeunes), bouton « Prévenir une personne de confiance ».
- Évite les faux positifs sur des expressions vagues (« je vais mal »).
- Paramètres locaux : toggle stockage local vs cloud chiffré (cloud = Bientôt), mode incognito persistant, mémoire personnalisée, IA locale Gemma (Bientôt), export JSON, suppression complète.
- Page « Mon évolution » modal : progression %, 4 stats, thèmes mockés, fruits symboliques.
- Persistance localStorage avec lazy init (pas de race condition au reload).
- Mode incognito : pas d'écriture localStorage, badge visible au-dessus du champ.
- Responsive : sidebar mobile avec burger + backdrop.
- Mention « ne remplace pas un professionnel de santé » sous le champ de saisie.
- 100 % data-testid sur les éléments interactifs.

## Backlog priorisé

### P1 — Court terme
- **Synchronisation cloud chiffrée (E2EE)** : passphrase locale, blob chiffré côté client.
- **Notifications douces** : rappel quotidien optionnel non culpabilisant.
- **Thème sombre** organique (palette nocturne sauge profond + ivoire).

### P2 — Moyen terme
- **Modèle IA local Gemma** via WebLLM/wllama dans le navigateur (vrai local-first).
- **Tags émotionnels** sur les messages utilisateur pour alimenter les vrais thèmes (au lieu des thèmes mockés).
- **Vue calendrier** des feuilles/fleurs/fruits par jour (sans streak — uniquement contemplatif).
- **Export PDF poétique** d'une saison (« Mon hiver doux »).

### P3 — Long terme
- **Mode multi-arbres** : un arbre par chapitre de vie.
- **Vocal** : dictée locale (Whisper.cpp WASM) — strictement on-device.
- **Partage sélectif** : un fruit transformé en carte privée pour un proche.

## Next Action Items
- Implémenter la synchronisation cloud chiffrée si l'utilisateur valide la direction.
- Brancher un LLM local (Gemma via WebLLM) pour passer du mock à du vrai conversationnel privé.
- Améliorer le SVG de l'arbre avec micro-animation de pousse à chaque feuille.
