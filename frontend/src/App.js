import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "@/App.css";

import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { EmergencySupportCard } from "@/components/EmergencySupportCard";
import { LocalSettingsPanel } from "@/components/LocalSettingsPanel";
import { InnerGardenEvolution } from "@/components/InnerGardenEvolution";
import { GrowthToast } from "@/components/GrowthToast";
import { OnboardingCategories } from "@/components/OnboardingCategories";
import { FlyingLeaf } from "@/components/FlyingLeaf";

import {
    MODE_RESPONSES,
    MODE_OPENERS,
    CRISIS_MESSAGE,
} from "@/lib/responses";
import {
    getStageFromCount,
    detectCrisis,
    computeGrowth,
    aggregateStats,
    daysSince,
    applyDecayToTrunk,
    applyDecayToCategories,
    getBranchShrink,
    getReturningMessage,
} from "@/lib/treeLogic";
import { streamChat, fetchLLMConfig } from "@/lib/api";
import { getBranchAngles } from "@/lib/categories";
import { getUserId } from "@/lib/userSeed";
import {
    createConversation,
    migrateToConversations,
    makeConversationTitle,
    trimConversations,
} from "@/lib/conversations";

// localStorage est utilisé pour rester local-first. Aucune donnée d'authentification
// n'y est stockée — uniquement le journal et les préférences sur la machine du user.
const STORAGE_KEY = "jardin-interieur-state-v3";
const STORAGE_KEY_V2 = "jardin-interieur-state-v2"; // ancien format pour migration
const INCOGNITO_KEY = "jardin-interieur-incognito-v1";
const LLM_KEY = "jardin-interieur-llm-config-v1";

const DEFAULT_TRUNK = { leaves: 0, roots: 0, flowers: 0, fruits: 0 };

const safeLoad = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn("[storage] load failed", key, err);
        return null;
    }
};
const safeWrite = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.warn("[storage] write failed", key, err);
    }
};
const safeRemove = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (err) {
        console.warn("[storage] remove failed", key, err);
    }
};
const loadIncognito = () => {
    try {
        return localStorage.getItem(INCOGNITO_KEY) === "1";
    } catch {
        return false;
    }
};

// Migration v2 → v3 si nécessaire
const loadAndMigrate = () => {
    const v3 = safeLoad(STORAGE_KEY);
    if (v3) return v3;
    const v2 = safeLoad(STORAGE_KEY_V2);
    if (!v2) return null;
    const conversations = migrateToConversations(v2);
    return {
        conversations,
        activeConversationId: conversations[0]?.id || null,
        messageCount: v2.messageCount || 0,
        trunk: v2.trunk || DEFAULT_TRUNK,
        categories: v2.categories || null,
        storageMode: v2.storageMode || "local",
        lastVisitDate: v2.lastVisitDate || null,
    };
};

function App() {
    const savedRef = useRef(loadAndMigrate());
    const saved = savedRef.current;

    const userId = useMemo(() => getUserId(), []);

    const [storageMode, setStorageMode] = useState(() => saved?.storageMode || "local");
    const [incognitoMode, setIncognitoMode] = useState(() => loadIncognito());

    const [conversations, setConversations] = useState(() =>
        migrateToConversations(saved)
    );
    const [activeConversationId, setActiveConversationId] = useState(() => {
        if (saved?.activeConversationId) return saved.activeConversationId;
        const firstConv = migrateToConversations(saved)[0];
        return firstConv?.id;
    });

    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messageCount, setMessageCount] = useState(() =>
        typeof saved?.messageCount === "number" ? saved.messageCount : 0
    );
    const [trunk, setTrunk] = useState(() => ({ ...DEFAULT_TRUNK, ...(saved?.trunk || {}) }));
    const [categories, setCategories] = useState(() => saved?.categories || null);
    const [lastVisitDate, setLastVisitDate] = useState(() => saved?.lastVisitDate || null);

    const [llmConfig, setLlmConfig] = useState(() => {
        const cfg = safeLoad(LLM_KEY);
        return {
            enabled: cfg?.enabled ?? true,
            baseUrl: cfg?.baseUrl || "http://localhost:1234/v1",
            model: cfg?.model || "gemma-3-4b-it",
        };
    });

    const [showOnboarding, setShowOnboarding] = useState(() => !saved?.categories);
    const [onboardingIsFirstTime, setOnboardingIsFirstTime] = useState(() => !saved?.categories);
    const [showEmergencyCard, setShowEmergencyCard] = useState(false);
    const [showLocalSettings, setShowLocalSettings] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [growthToast, setGrowthToast] = useState(null);
    const toastTimerRef = useRef(null);
    const [flyingLeaves, setFlyingLeaves] = useState([]);

    const streamControllerRef = useRef(null);
    // Ref synchronisé avec conversations + activeId pour éviter closures périmées
    const stateRef = useRef({ conversations, activeConversationId });
    useEffect(() => {
        stateRef.current = { conversations, activeConversationId };
    }, [conversations, activeConversationId]);

    // ====== Dérivation de la conv active ======
    const activeConv = useMemo(
        () =>
            conversations.find((c) => c.id === activeConversationId) ||
            conversations[0],
        [conversations, activeConversationId]
    );
    const selectedMode = activeConv?.mode || "free";
    const messages = activeConv?.messages || [];
    const selectedCategoryId = activeConv?.branchId || null;

    // ====== Helpers d'update de la conv active ======
    const updateActiveConv = useCallback((updater) => {
        setConversations((prev) =>
            prev.map((c) => {
                if (c.id !== stateRef.current.activeConversationId) return c;
                const updated = typeof updater === "function" ? updater(c) : { ...c, ...updater };
                return { ...updated, updatedAt: new Date().toISOString() };
            })
        );
    }, []);

    const setSelectedCategoryId = useCallback(
        (id) => updateActiveConv({ branchId: id }),
        [updateActiveConv]
    );

    // ====== Persistance ======
    useEffect(() => {
        if (incognitoMode) return;
        safeWrite(STORAGE_KEY, {
            conversations: trimConversations(conversations),
            activeConversationId,
            messageCount,
            trunk,
            categories,
            storageMode,
            lastVisitDate,
        });
    }, [conversations, activeConversationId, messageCount, trunk, categories, storageMode, incognitoMode, lastVisitDate]);

    useEffect(() => {
        if (incognitoMode) safeWrite(INCOGNITO_KEY, "1");
        else safeRemove(INCOGNITO_KEY);
    }, [incognitoMode]);

    useEffect(() => {
        safeWrite(LLM_KEY, llmConfig);
    }, [llmConfig]);

    useEffect(() => {
        fetchLLMConfig().then((cfg) => {
            if (!cfg) return;
            const local = safeLoad(LLM_KEY);
            if (!local) {
                setLlmConfig((prev) => ({
                    ...prev,
                    baseUrl: cfg.base_url || prev.baseUrl,
                    model: cfg.model || prev.model,
                }));
            }
        });
    }, []);

    // Message de retour au mount selon durée d'absence
    useEffect(() => {
        if (!lastVisitDate) return;
        const days = daysSince(lastVisitDate);
        const msg = getReturningMessage(days);
        if (msg && (activeConv?.messages?.length || 0) <= 1) {
            updateActiveConv((c) => ({
                ...c,
                messages: [
                    ...c.messages,
                    {
                        id: `back-${Date.now()}`,
                        role: "assistant",
                        type: "text",
                        text: msg,
                    },
                ],
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ====== Decay visuel ======
    const daysAbsent = useMemo(() => daysSince(lastVisitDate), [lastVisitDate]);
    const visualTrunk = useMemo(
        () => applyDecayToTrunk(trunk, daysAbsent),
        [trunk, daysAbsent]
    );
    const visualCategories = useMemo(
        () => applyDecayToCategories(categories, daysAbsent),
        [categories, daysAbsent]
    );
    const branchShrink = useMemo(() => getBranchShrink(daysAbsent), [daysAbsent]);

    const treeMeta = getStageFromCount(messageCount);
    const aggregated = aggregateStats(visualTrunk, visualCategories);
    const treeStats = {
        ...treeMeta,
        stageKey: treeMeta.key,
        ...aggregated,
        trunk: visualTrunk,
        categories: visualCategories || [],
        realTrunk: trunk,
        realCategories: categories || [],
        messageCount,
        seed: userId,
        branchShrink,
        daysAbsent,
    };

    const showGrowth = useCallback((events) => {
        if (!events?.length) return;
        setGrowthToast(events[0]);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setGrowthToast(null), 3200);
    }, []);

    const triggerFlyingLeaf = useCallback(
        (categoryId) => {
            if (!categoryId || !categories) return;
            const idx = categories.findIndex((c) => c.id === categoryId);
            if (idx < 0) return;
            const cat = categories[idx];
            const angles = getBranchAngles(categories.length);
            const angle = angles[idx];

            const input = document.querySelector('[data-testid="chat-input-container"]');
            const inputRect = input?.getBoundingClientRect();
            if (!inputRect) return;
            const from = {
                x: inputRect.left + inputRect.width / 2 - 11,
                y: inputRect.top + 10,
            };
            const svg = document.querySelector('[data-tree-svg="true"]');
            if (!svg) return;
            const svgRect = svg.getBoundingClientRect();
            const sx = svgRect.width / 120;
            const sy = svgRect.height / 140;
            const rad = ((angle - 90) * Math.PI) / 180;
            const heightFactor = Math.max(0, Math.min(1, (treeMeta.progress - 5) / 90));
            const originY = 125 - 8 - heightFactor * 75 + 4;
            const total = (cat.leaves || 0) + (cat.flowers || 0) + (cat.fruits || 0);
            const length = 18 + heightFactor * 14 + Math.min(total, 18) * 0.85;
            const tipX = 60 + Math.cos(rad) * length;
            const tipY = originY + Math.sin(rad) * length;
            const to = {
                x: svgRect.left + tipX * sx - 11,
                y: svgRect.top + tipY * sy - 11,
            };
            const id = `leaf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            setFlyingLeaves((prev) => [...prev, { id, from, to, color: cat.color }]);
        },
        [categories, treeMeta.progress]
    );

    const removeFlyingLeaf = useCallback((id) => {
        setFlyingLeaves((prev) => prev.filter((l) => l.id !== id));
    }, []);

    const runMockReply = useCallback(() => {
        setIsTyping(true);
        const mode = stateRef.current.conversations.find(
            (c) => c.id === stateRef.current.activeConversationId
        )?.mode || "free";
        const delay = 1500 + Math.random() * 600;
        setTimeout(() => {
            const pool = MODE_RESPONSES[mode] || MODE_RESPONSES.free;
            const reply = pool[Math.floor(Math.random() * pool.length)];
            setIsTyping(false);
            updateActiveConv((c) => ({
                ...c,
                messages: [
                    ...c.messages,
                    {
                        id: `a-${Date.now()}`,
                        role: "assistant",
                        type: "text",
                        text: reply,
                    },
                ],
            }));
        }, delay);
    }, [updateActiveConv]);

    const startLLMStream = useCallback(
        (latestUserText) => {
            const conv = stateRef.current.conversations.find(
                (c) => c.id === stateRef.current.activeConversationId
            );
            const history = (conv?.messages || [])
                .filter((m) => m.type !== "crisis" && !m.streaming)
                .filter((m) => (m.text || "").trim().length > 0)
                .map((m) => ({ role: m.role, content: m.text }));
            history.push({ role: "user", content: latestUserText });

            const aiId = `a-${Date.now()}`;
            updateActiveConv((c) => ({
                ...c,
                messages: [
                    ...c.messages,
                    {
                        id: aiId,
                        role: "assistant",
                        type: "text",
                        text: "",
                        streaming: true,
                    },
                ],
            }));
            setIsTyping(true);
            streamControllerRef.current?.abort();

            let buffer = "";
            let done = false;
            let crisisHit = false;
            let errorHit = false;

            const finalize = () => {
                if (done) return;
                done = true;
                setIsTyping(false);
                updateActiveConv((c) => ({
                    ...c,
                    messages: c.messages.map((m) =>
                        m.id === aiId ? { ...m, streaming: false } : m
                    ),
                }));
            };

            streamChat(
                {
                    messages: history,
                    mode: conv?.mode || "free",
                    categories: categories || [],
                    base_url: llmConfig.baseUrl,
                    model: llmConfig.model,
                },
                {
                    onDelta: (chunk) => {
                        if (crisisHit || errorHit) return;
                        buffer += chunk;
                        updateActiveConv((c) => ({
                            ...c,
                            messages: c.messages.map((m) =>
                                m.id === aiId ? { ...m, text: buffer } : m
                            ),
                        }));
                        setIsTyping(false);
                    },
                    onCrisis: (msg) => {
                        crisisHit = true;
                        setIsTyping(false);
                        updateActiveConv((c) => ({
                            ...c,
                            messages: c.messages
                                .filter((m) => m.id !== aiId)
                                .concat({
                                    id: `c-${Date.now()}`,
                                    role: "assistant",
                                    type: "crisis",
                                    text: msg || CRISIS_MESSAGE,
                                }),
                        }));
                    },
                    onError: (err) => {
                        if (errorHit) return;
                        errorHit = true;
                        setIsTyping(false);
                        console.warn("[llm] error", err);
                        const pool = MODE_RESPONSES[conv?.mode || "free"] || MODE_RESPONSES.free;
                        const fallback = pool[Math.floor(Math.random() * pool.length)];
                        updateActiveConv((c) => ({
                            ...c,
                            messages: c.messages.map((m) =>
                                m.id === aiId
                                    ? {
                                          ...m,
                                          text: fallback,
                                          streaming: false,
                                          llmError: err?.message || "LLM unreachable",
                                      }
                                    : m
                            ),
                        }));
                    },
                    onDone: finalize,
                }
            ).then((controller) => {
                streamControllerRef.current = controller;
            });
        },
        [categories, llmConfig, updateActiveConv]
    );

    const handleSend = useCallback(() => {
        const text = inputValue.trim();
        if (!text) return;
        const currentCategoryId = selectedCategoryId; // sticky : on garde cette branche

        const userMsg = {
            id: `u-${Date.now()}`,
            role: "user",
            type: "text",
            text,
            categoryId: currentCategoryId,
        };
        updateActiveConv((c) => ({ ...c, messages: [...c.messages, userMsg] }));
        setInputValue("");
        setLastVisitDate(new Date().toISOString());

        const nextCount = messageCount + 1;
        setMessageCount(nextCount);

        const result = computeGrowth(
            trunk,
            categories,
            selectedMode,
            nextCount,
            currentCategoryId
        );
        setTrunk(result.trunk);
        if (result.categories) setCategories(result.categories);
        showGrowth(result.growthEvents);

        if (currentCategoryId && result.growthEvents.length > 0) {
            setTimeout(() => triggerFlyingLeaf(currentCategoryId), 150);
        }

        // !!! Pas de reset du selectedCategoryId : la branche reste collante.

        if (detectCrisis(text)) {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                updateActiveConv((c) => ({
                    ...c,
                    messages: [
                        ...c.messages,
                        {
                            id: `c-${Date.now()}`,
                            role: "assistant",
                            type: "crisis",
                            text: CRISIS_MESSAGE,
                        },
                    ],
                }));
            }, 500);
            return;
        }

        if (llmConfig.enabled) {
            startLLMStream(text);
        } else {
            runMockReply();
        }
    }, [
        inputValue,
        selectedCategoryId,
        messageCount,
        trunk,
        categories,
        selectedMode,
        showGrowth,
        triggerFlyingLeaf,
        llmConfig.enabled,
        startLLMStream,
        runMockReply,
        updateActiveConv,
    ]);

    // ====== Conversations ======
    const handleNewConversation = useCallback(() => {
        streamControllerRef.current?.abort();
        const conv = createConversation(selectedMode, null);
        setConversations((prev) => trimConversations([conv, ...prev]));
        setActiveConversationId(conv.id);
        setInputValue("");
        setSidebarOpen(false);
    }, [selectedMode]);

    const handleSelectConversation = useCallback((id) => {
        streamControllerRef.current?.abort();
        setActiveConversationId(id);
        setInputValue("");
        setSidebarOpen(false);
    }, []);

    const handleDeleteConversation = useCallback(
        (id) => {
            setConversations((prev) => {
                const filtered = prev.filter((c) => c.id !== id);
                // S'il ne reste rien, recrée une conv vide
                if (filtered.length === 0) {
                    const fresh = createConversation(selectedMode);
                    setActiveConversationId(fresh.id);
                    return [fresh];
                }
                // Si on supprime la conv active, bascule sur la plus récente
                if (id === stateRef.current.activeConversationId) {
                    const next = [...filtered].sort(
                        (a, b) =>
                            new Date(b.updatedAt || b.createdAt).getTime() -
                            new Date(a.updatedAt || a.createdAt).getTime()
                    )[0];
                    setActiveConversationId(next.id);
                }
                return filtered;
            });
        },
        [selectedMode]
    );

    const handleSelectMode = useCallback(
        (mode) => {
            if (mode === selectedMode) return;
            // On met à jour le mode de la conv active + on met un opener
            updateActiveConv((c) => ({
                ...c,
                mode,
                title: makeConversationTitle(mode, c.createdAt),
                messages: [
                    ...c.messages,
                    {
                        id: `mode-${Date.now()}`,
                        role: "assistant",
                        type: "text",
                        text: MODE_OPENERS[mode],
                    },
                ],
            }));
            setSidebarOpen(false);
        },
        [selectedMode, updateActiveConv]
    );

    const handleSaveCategories = useCallback((newCats) => {
        setCategories(newCats);
        setShowOnboarding(false);
        setOnboardingIsFirstTime(false);
    }, []);

    const handleOpenCategoryEditor = useCallback(() => {
        setOnboardingIsFirstTime(false);
        setShowOnboarding(true);
        setSidebarOpen(false);
    }, []);

    const handleExport = useCallback(() => {
        try {
            const payload = {
                exportedAt: new Date().toISOString(),
                conversations,
                activeConversationId,
                messageCount,
                trunk,
                categories,
                lastVisitDate,
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `jardin-interieur-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.warn("[export] failed", err);
        }
    }, [conversations, activeConversationId, messageCount, trunk, categories, lastVisitDate]);

    const handleClearAll = useCallback(() => {
        const confirmed = window.confirm(
            "Veux-tu vraiment supprimer toutes tes données locales ? Ton arbre reviendra à une graine endormie."
        );
        if (!confirmed) return;
        safeRemove(STORAGE_KEY);
        safeRemove(STORAGE_KEY_V2);
        const fresh = createConversation("free");
        setConversations([fresh]);
        setActiveConversationId(fresh.id);
        setMessageCount(0);
        setTrunk(DEFAULT_TRUNK);
        setCategories(null);
        setLastVisitDate(null);
        setShowLocalSettings(false);
        setOnboardingIsFirstTime(true);
        setShowOnboarding(true);
    }, []);

    return (
        <div className="App flex" style={{ backgroundColor: "#FAF9F6" }}>
            <Sidebar
                selectedMode={selectedMode}
                onSelectMode={handleSelectMode}
                onNewReflection={handleNewConversation}
                treeStats={treeStats}
                onOpenEmergency={() => setShowEmergencyCard(true)}
                onOpenSettings={() => setShowLocalSettings(true)}
                onOpenEvolution={() => setShowEvolution(true)}
                onOpenCategoryEditor={handleOpenCategoryEditor}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
                <ChatArea
                    messages={messages}
                    isTyping={isTyping}
                    mode={selectedMode}
                    treeStats={treeStats}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenEmergency={() => setShowEmergencyCard(true)}
                    onOpenEvolution={() => setShowEvolution(true)}
                />
                <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    mode={selectedMode}
                    disabled={false}
                    incognito={incognitoMode}
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                />
            </main>

            {showEmergencyCard && (
                <EmergencySupportCard onClose={() => setShowEmergencyCard(false)} />
            )}

            {showLocalSettings && (
                <LocalSettingsPanel
                    onClose={() => setShowLocalSettings(false)}
                    incognito={incognitoMode}
                    onToggleIncognito={setIncognitoMode}
                    onExport={handleExport}
                    onClearAll={handleClearAll}
                    storageMode={storageMode}
                    onChangeStorageMode={setStorageMode}
                    llmConfig={llmConfig}
                    onUpdateLlmConfig={setLlmConfig}
                />
            )}

            {showEvolution && (
                <InnerGardenEvolution
                    treeStats={treeStats}
                    onClose={() => setShowEvolution(false)}
                    onEditCategories={handleOpenCategoryEditor}
                />
            )}

            {showOnboarding && (
                <OnboardingCategories
                    initialCategories={categories}
                    onSave={handleSaveCategories}
                    onClose={() => setShowOnboarding(false)}
                    isFirstTime={onboardingIsFirstTime}
                />
            )}

            <GrowthToast message={growthToast} />

            {flyingLeaves.map((l) => (
                <FlyingLeaf
                    key={l.id}
                    from={l.from}
                    to={l.to}
                    color={l.color}
                    onDone={() => removeFlyingLeaf(l.id)}
                />
            ))}
        </div>
    );
}

export default App;
