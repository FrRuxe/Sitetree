// Client API du backend Jardin Intérieur.
// Toutes les opérations IA / détection / croissance passent par ici.

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export async function fetchLLMConfig() {
    try {
        const res = await fetch(`${API}/config/llm`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function detectBranch(text, categories) {
    if (!text?.trim() || !categories?.length) return null;
    try {
        const res = await fetch(`${API}/branch/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, categories }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.detection || null;
    } catch {
        return null;
    }
}

export async function detectCrisisApi(text) {
    try {
        const res = await fetch(`${API}/crisis/detect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) return { is_crisis: false };
        return await res.json();
    } catch {
        return { is_crisis: false };
    }
}

export async function computeServerGrowth(payload) {
    try {
        const res = await fetch(`${API}/tree/grow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * Stream une réponse de chat depuis le LLM local (LM Studio).
 *
 * @param {Object} payload - { messages, mode, categories, base_url?, model?, api_key? }
 * @param {Object} handlers - { onDelta(text), onCrisis(text), onError(err), onDone() }
 * @returns {Promise<AbortController>} le controller pour interrompre le stream
 */
export async function streamChat(payload, handlers) {
    const controller = new AbortController();
    const { onDelta, onCrisis, onError, onDone } = handlers;

    (async () => {
        try {
            const res = await fetch(`${API}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                onError?.(new Error(`HTTP ${res.status}`));
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                // SSE = lignes séparées par \n\n
                let idx;
                while ((idx = buffer.indexOf("\n\n")) !== -1) {
                    const raw = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    const line = raw.trim();
                    if (!line.startsWith("data:")) continue;
                    const data = line.slice(5).trim();
                    if (!data) continue;
                    let evt;
                    try {
                        evt = JSON.parse(data);
                    } catch {
                        continue;
                    }
                    if (evt.type === "delta") onDelta?.(evt.content || "");
                    else if (evt.type === "crisis") onCrisis?.(evt.content || "");
                    else if (evt.type === "error") onError?.(new Error(evt.message || "LLM error"));
                    else if (evt.type === "done") onDone?.();
                }
            }
        } catch (e) {
            if (e.name !== "AbortError") onError?.(e);
        } finally {
            onDone?.();
        }
    })();

    return controller;
}
