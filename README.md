# Jardin Intérieur 🌿

> Un espace privé et bienveillant pour déposer ses pensées, suivre son humeur
> et visualiser sa progression personnelle grâce à un arbre intérieur.
>
> **Ce n'est pas une application médicale.** Luma n'est ni psychologue, ni
> thérapeute, ni médecin. C'est un confident IA local-first et un journal
> conversationnel.

## ✨ Fonctionnalités

- **Chat conversationnel** avec 4 modes d'écoute (Conversation libre, Bilan
  de journée, Je rumine, Conversation légère).
- **Arbre intérieur** qui pousse selon tes conversations — 4 stades
  (graine → pousse → croissance → arbre vivant) et 4 saisons émotionnelles.
- **Catégories / branches personnalisables** : tu plantes ton arbre avec 3 à
  6 domaines de vie. Chaque branche a sa couleur et grandit indépendamment.
- **Auto-suggestion de branche** par mots-clés dès que tu commences à écrire.
- **Animation de feuille volante** depuis le champ vers la branche concernée.
- **LLM local** via **LM Studio** (Gemma 3 4B recommandé) — réponses en
  streaming, prompts adaptés au mode d'écoute, **rien ne quitte ta machine**.
- **Garde-fou de crise** : détection locale d'expressions de détresse,
  affichage immédiat des ressources (3114 France).
- **Local-first** : tout est stocké dans le `localStorage` du navigateur. Mode
  incognito disponible. Export JSON. Suppression complète.

---

## 🧠 Architecture

```
┌───────────────────┐         ┌────────────────────┐         ┌────────────┐
│  React frontend   │  HTTP   │  FastAPI backend   │  HTTP   │ LM Studio  │
│  (Tailwind, SVG)  │ ──────► │  (proxy + logique) │ ──────► │ (Gemma 3)  │
└───────────────────┘         └────────────────────┘         └────────────┘
        ▲                              │
        │ SSE streaming                │
        └──────────────────────────────┘
```

**Frontend** : React 19 + Tailwind. UI, animations, persistance localStorage,
détection de crise locale (sécurité supplémentaire), composants SVG de l'arbre.

**Backend** : FastAPI + httpx. Proxy vers LM Studio (évite les soucis CORS et
centralise le prompt système), détection de branche par mots-clés, logique de
croissance de l'arbre, détection de crise serveur.

**LLM** : Deux options au choix dans les Paramètres locaux :
- **LM Studio** (par défaut) — servant un modèle OpenAI-compatible sur `http://localhost:1234/v1`. Tu peux remplacer par n'importe quel autre serveur (Ollama, vLLM, llama.cpp avec `--openai`, etc.).
- **WebLLM** — modèle qui tourne **100% dans ton navigateur** via WebGPU (`@mlc-ai/web-llm`). Le modèle est téléchargé une fois (~1-2 Go) et mis en cache navigateur. **Aucun backend n'est requis pour le chat dans ce mode.** Compatible Chrome/Edge/Brave récents. Modèle par défaut : `gemma-3-4b-it-q4f16_1-MLC`. Tu peux changer l'ID dans les paramètres dès qu'un build Gemma 4 E4B sera publié.

---

## 🚀 Démarrage en local

### Prérequis
- **Node.js 18+** et **Yarn** (`npm install -g yarn`)
- **Python 3.10+**
- **LM Studio** : https://lmstudio.ai/

### 1. Installer LM Studio et charger Gemma

1. Télécharge et installe LM Studio.
2. Dans l'onglet **Search**, cherche `gemma-3-4b-it` (ou `gemma-2-9b-it` si ta
   machine est plus puissante) et télécharge-le. Format `GGUF` recommandé,
   quantization `Q4_K_M` est un bon compromis.
3. Va dans l'onglet **Local Server** (icône `<>`) :
   - Charge le modèle (sélecteur en haut).
   - Active **CORS** (option dans les paramètres du serveur).
   - Clique sur **Start Server**. Par défaut il écoute sur
     `http://localhost:1234`.

### 2. Lancer le backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # sur Windows : .venv\Scripts\activate
pip install -r requirements.txt
# Vérifie/modifie backend/.env si besoin (LLM_BASE_URL, LLM_MODEL)
uvicorn server:app --reload --port 8001
```

Le backend tourne sur `http://localhost:8001` avec les endpoints :
- `GET  /api/`                — status + config LLM par défaut
- `POST /api/chat/stream`     — réponse streaming (SSE)
- `POST /api/branch/detect`   — détection de la branche probable
- `POST /api/crisis/detect`   — détection de crise
- `POST /api/tree/grow`       — calcul de la croissance
- `GET  /api/config/llm`      — config LLM par défaut

### 3. Lancer le frontend

```bash
cd frontend
yarn install
# Vérifie frontend/.env : REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Ouvre `http://localhost:3000`.

### 4. Premier lancement

Au premier chargement, une modale s'ouvre pour planter ton arbre :
choisis 3 à 6 branches (Travail, Relations, Santé, Famille, Projets, Soi —
ou les tiennes propres). Puis commence à parler. Tu peux modifier tes
branches à tout moment via **Mes branches** dans la sidebar.

Si LM Studio n'est pas lancé, l'app bascule automatiquement en **mode démo**
(réponses simulées) — tu verras une mention discrète « ↳ Mode démo activé »
sous les réponses concernées.

---

## ⚙️ Configuration

### `backend/.env`
```env
LLM_BASE_URL="http://localhost:1234/v1"
LLM_MODEL="gemma-3-4b-it"
LLM_API_KEY="lm-studio"

### Option B : Tout-en-navigateur avec WebLLM (Gemma via WebGPU)

Si tu ne veux **pas** lancer LM Studio, tu peux utiliser WebLLM, qui exécute le
modèle directement dans le navigateur via WebGPU. Aucun backend n'est sollicité
pour le chat dans ce mode (le backend FastAPI sert uniquement la détection de
branche et de crise — purement local et synchrone).

1. Ouvre l'app dans **Chrome**, **Edge** ou **Brave** (récents).
2. Va dans **Paramètres locaux** (engrenage dans la sidebar).
3. Dans **Moteur d'intelligence**, clique **WebLLM (navigateur)**.
4. Le modèle par défaut est `gemma-3-4b-it-q4f16_1-MLC`. Tu peux le remplacer
   par n'importe quel ID publié par @mlc-ai/web-llm (liste sur
   https://github.com/mlc-ai/web-llm). Quand Gemma 4 E4B sera officiellement
   publié, mets simplement son ID dans le champ.
5. Clique **Initialiser l'IA locale**. Premier lancement : téléchargement du
   modèle (~1-2 Go selon la quantization), suivi en direct par la barre de
   progression. Les fois suivantes, le modèle est instantané (cache navigateur).
6. Une fois prêt, tous tes messages partent vers le modèle local du navigateur.
   Aucune donnée ne quitte ta machine.

Tu peux à tout moment décharger le moteur ou rebasculer vers LM Studio depuis
les mêmes paramètres.


LLM_TIMEOUT="60"
CORS_ORIGINS="*"
```

### `frontend/.env`
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Tu peux aussi modifier l'URL et le nom du modèle **à chaud** depuis le
panneau **Paramètres locaux** dans l'app (icône engrenage en bas de la
sidebar). Ces valeurs sont stockées localement dans le navigateur.

---

## 🌳 Logique de croissance

Pour chaque message utilisateur :
- **+1 feuille** sur la branche tagguée (ou sur le tronc général si pas de tag)
- **+1 racine** toutes les 3 conversations (toujours sur le tronc)
- **+1 fleur** en mode *Bilan de journée*
- **+1 fruit** en mode *Je rumine* après 2 messages

L'arbre passe par 4 stades selon le nombre total de messages :
- `0` : Graine endormie · Hiver doux
- `> 2` : Jeune pousse · Printemps
- `> 5` : Arbre en croissance · Été calme
- `> 9` : Arbre vivant · Automne lumineux

**L'arbre ne meurt jamais. Aucun streak. Aucun classement.**

---

## 🛡️ Sécurité émotionnelle

Si un message contient une expression de détresse (suicide, envie de mourir,
me faire du mal, en finir, etc., insensible aux accents/casse), l'app :
1. Court-circuite l'appel au LLM.
2. Affiche une carte rose avec le **3114** (numéro national de prévention du
   suicide, France, 24h/24, gratuit) et d'autres ressources.
3. Propose d'appeler de l'aide, voir les ressources, ou prévenir une personne
   de confiance.

La détection tourne **à la fois côté frontend et côté backend** pour double
sécurité. Cf. `backend/services/crisis.py` et
`frontend/src/lib/treeLogic.js`.

---

## 🧩 Structure du projet

```
.
├── backend/
│   ├── server.py                 # FastAPI app + routes
│   ├── requirements.txt
│   ├── .env                      # config LLM + CORS
│   └── services/
│       ├── llm.py                # client streaming LM Studio
│       ├── prompts.py            # system prompts par mode
│       ├── branch_detection.py   # détection de branche (mots-clés)
│       ├── crisis.py             # détection de crise
│       └── tree.py               # logique de croissance
└── frontend/
    ├── package.json
    ├── .env                      # REACT_APP_BACKEND_URL
    └── src/
        ├── App.js                # état global, streaming, animations
        ├── lib/
        │   ├── api.js            # client backend (fetch + SSE)
        │   ├── responses.js      # mock fallback + microcopy
        │   ├── treeLogic.js      # croissance frontend
        │   └── categories.js     # palettes et défauts
        └── components/
            ├── Sidebar.jsx
            ├── ChatArea.jsx
            ├── ChatInput.jsx           # auto-suggestion par debounce
            ├── MessageBubble.jsx       # streaming + curseur
            ├── CategoryChips.jsx
            ├── TreeWidget.jsx
            ├── InnerTreeSvg.jsx        # SVG vectoriel avec branches
            ├── InnerGardenEvolution.jsx
            ├── OnboardingCategories.jsx
            ├── LocalSettingsPanel.jsx  # config LLM + paramètres
            ├── EmergencySupportCard.jsx
            ├── GrowthToast.jsx
            └── FlyingLeaf.jsx          # animation feuille volante
```

---

## 🔧 Dépannage

**« Mode démo activé » apparaît à chaque réponse**
→ LM Studio n'est pas joignable. Vérifie :
- Le serveur local est démarré dans LM Studio (onglet Local Server).
- L'URL configurée dans Paramètres locaux correspond (par défaut
  `http://localhost:1234/v1`).
- CORS est activé dans LM Studio.
- Le nom du modèle correspond à celui chargé dans LM Studio (visible dans
  l'onglet Local Server, à côté du sélecteur de modèle).

**Erreur CORS du frontend vers le backend**
→ Vérifie `CORS_ORIGINS=*` dans `backend/.env` (déjà par défaut).

**Le backend ne démarre pas — `ModuleNotFoundError: No module named 'services'`**
→ Lance bien `uvicorn` depuis le dossier `backend/`, ou ajoute
`--app-dir backend` si tu es à la racine.

**Le modèle est très lent**
→ Essaie une quantization plus agressive (`Q4_K_S` ou `Q3_K_M`), ou un
modèle plus petit (`gemma-3-1b-it`). Tu peux aussi réduire `max_tokens`
dans `backend/services/llm.py` (actuellement 400).

---

## 📜 Licence et usage

Prototype personnel. Adapte-le librement à tes besoins.

**Important** : cette application n'est pas un dispositif médical, ne
prétend pas en être un, et ne doit pas être présentée comme tel. Elle ne
remplace en aucun cas un professionnel de santé mentale. En cas de
détresse, le 3114 (France) est gratuit, anonyme et disponible 24h/24.

🌿
