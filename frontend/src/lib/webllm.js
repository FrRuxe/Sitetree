// Client WebLLM (in-browser via WebGPU).
// Lazy import de @mlc-ai/web-llm pour ne pas alourdir le bundle initial.
// Engine singleton conservé en mémoire (impossible à persister entre rechargements).

import { CRISIS_MESSAGE } from "./responses";
import { buildSystemPrompt } from "./llmPrompts";

let _engine = null;
let _engineModelId = null;

export function isWebGPUAvailable() {
    return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function isEngineReady(modelId) {
    return _engine !== null && (!modelId || _engineModelId === modelId);
}

export function getCurrentEngineModel() {
    return _engineModelId;
}

/**
 * Charge (ou recharge) le moteur WebLLM avec le modèle demandé.
 * @param {string} modelId — ex: "gemma-3-4b-it-q4f16_1-MLC"
 * @param {(p: { progress: number, text: string }) => void} onProgress
 */
export async function initWebLLMEngine(modelId, onProgress) {
    if (!isWebGPUAvailable()) {
        throw new Error(
            "WebGPU n'est pas disponible dans ce navigateur. Utilise Chrome, Edge ou Brave (les plus récents)."
        );
    }
    // Si déjà chargé avec le même modèle, on réutilise
    if (_engine && _engineModelId === modelId) {
        onProgress?.({ progress: 1, text: "Modèle déjà prêt." });
        return _engine;
    }
    // Décharge l'ancien moteur si on change de modèle
    if (_engine && _engineModelId !== modelId) {
        try {
            await _engine.unload?.();
        } catch (err) {
            console.warn("[webllm] unload previous engine failed", err);
        }
        _engine = null;
        _engineModelId = null;
    }

    const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
    try {
        _engine = await CreateMLCEngine(modelId, {
            initProgressCallback: (p) => {
                onProgress?.({
                    progress: typeof p.progress === "number" ? p.progress : 0,
                    text: p.text || "",
                });
            },
        });
        _engineModelId = modelId;
        return _engine;
    } catch (err) {
        _engine = null;
        _engineModelId = null;
        throw err;
    }
}

export async function disposeEngine() {
    if (!_engine) return;
    try {
        await _engine.unload?.();
    } catch (err) {
        console.warn("[webllm] dispose failed", err);
    }
    _engine = null;
    _engineModelId = null;
}

/**
 * Stream une réponse via WebLLM, signature compatible avec streamChat() du backend.
 * payload: { messages, mode, categories, activeBranchId? }
 * handlers: { onDelta, onCrisis, onError, onDone }
 * Retourne un AbortController.
 */
export async function streamChatWebLLM(payload, handlers) {
    const controller = new AbortController();
    const { onDelta, onCrisis, onError, onDone } = handlers;

    (async () => {
        if (!_engine) {
            onError?.(new Error("Moteur WebLLM non initialisé. Active-le dans les Paramètres locaux."));
            onDone?.();
            return;
        }

        // Construire le système prompt côté client (le backend n'est pas dans la boucle).
        const system = buildSystemPrompt(
            payload.mode,
            payload.categories,
            payload.activeBranchId
        );
        const messages = [
            { role: "system", content: system },
            ...(payload.messages || []).filter(
                (m) => m.role === "user" || m.role === "assistant"
            ),
        ];

        // Vérification crise locale au cas où (double sécurité, même si déjà fait côté UI)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser && shouldShortCircuitForCrisis(lastUser.content)) {
            onCrisis?.(CRISIS_MESSAGE);
            onDone?.();
            return;
        }

        let completion;
        try {
            completion = await _engine.chat.completions.create({
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 400,
            });
        } catch (err) {
            console.warn("[webllm] create failed", err);
            onError?.(new Error(humanizeWebLLMError(err)));
            onDone?.();
            return;
        }

        try {
            for await (const chunk of completion) {
                if (controller.signal.aborted) {
                    try {
                        await _engine.interruptGenerate?.();
                    } catch (e) { /* noop */ }
                    break;
                }
                const content =
                    chunk.choices?.[0]?.delta?.content ||
                    chunk.choices?.[0]?.message?.content;
                if (content) onDelta?.(content);
            }
        } catch (err) {
            console.warn("[webllm] stream failed", err);
            onError?.(new Error(humanizeWebLLMError(err)));
        } finally {
            onDone?.();
        }
    })();

    return controller;
}

// Détection légère côté client pour éviter d'envoyer une crise au LLM
function shouldShortCircuitForCrisis(text) {
    if (!text) return false;
    const norm = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, " ");
    const phrases = [
        "suicide", "me suicider", "envie de mourir", "je veux en finir",
        "en finir", "me faire du mal", "automutilation",
        "je ne veux plus vivre", "ne plus vivre", "passer a l acte",
    ];
    return phrases.some((p) => norm.includes(p));
}

function humanizeWebLLMError(err) {
    const msg = String(err?.message || err || "");
    if (/webgpu|gpu/i.test(msg) && /unsupported|not.*support/i.test(msg)) {
        return "WebGPU n'est pas supporté par ce navigateur.";
    }
    if (/out of memory|oom|allocation/i.test(msg)) {
        return "Mon esprit s'embrouille (Erreur de mémoire locale). Peux-tu recharger la page ?";
    }
    if (/network|fetch|cors/i.test(msg)) {
        return "Téléchargement du modèle interrompu. Vérifie ta connexion et réessaie.";
    }
    if (/model.*not.*found|404/i.test(msg)) {
        return "Modèle introuvable dans la liste WebLLM. Vérifie l'ID du modèle dans les Paramètres locaux.";
    }
    return msg || "Erreur inconnue du moteur local.";
}
