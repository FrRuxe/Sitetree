// Helpers pour gérer la liste de conversations.

import { MODE_LABELS, MODE_OPENERS } from "./responses";

export const MAX_CONVERSATIONS = 50;

const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `conv-${crypto.randomUUID()}`;
    }
    return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export function makeConversationTitle(mode, createdAt) {
    const d = new Date(createdAt);
    let dateStr;
    try {
        dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    } catch {
        dateStr = d.toISOString().slice(0, 10);
    }
    return `${dateStr} — ${MODE_LABELS[mode] || mode}`;
}

export function createConversation(mode = "free", branchId = null) {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        mode,
        title: makeConversationTitle(mode, now),
        createdAt: now,
        updatedAt: now,
        branchId,
        messages: [
            {
                id: `init-${Date.now()}`,
                role: "assistant",
                type: "text",
                text: MODE_OPENERS[mode] || MODE_OPENERS.free,
            },
        ],
    };
}

// Migration de l'ancien format (saved.messages + saved.selectedMode)
// vers le format conversations[].
export function migrateToConversations(saved) {
    if (saved?.conversations?.length) {
        return saved.conversations;
    }
    if (saved?.messages?.length) {
        const mode = saved.selectedMode || "free";
        const now = saved.lastVisitDate || new Date().toISOString();
        return [
            {
                id: generateId(),
                mode,
                title: makeConversationTitle(mode, now),
                createdAt: now,
                updatedAt: now,
                branchId: null,
                messages: saved.messages,
            },
        ];
    }
    return [createConversation("free")];
}

// Garantit qu'on ne dépasse jamais MAX_CONVERSATIONS (les plus anciennes sont coupées)
export function trimConversations(list) {
    if (list.length <= MAX_CONVERSATIONS) return list;
    return [...list]
        .sort((a, b) => {
            const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return db - da;
        })
        .slice(0, MAX_CONVERSATIONS);
}
