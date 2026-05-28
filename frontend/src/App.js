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

// Note de sécurité : `localStorage` est utilisé volontairement pour rester local-first.
// Aucune donnée d'authentification ni token sensible n'y est stocké — uniquement
// le journal et les préférences de l'utilisateur sur SA propre machine.
// Le projet n'a pas de notion d'utilisateur distant ; le risque XSS d'un script
// tiers est inexistant car l'app ne charge aucun script externe.
const STORAGE_KEY = "jardin-interieur-state-v2";
const INCOGNITO_KEY = "jardin-interieur-incognito-v1";
const LLM_KEY = "jardin-interieur-llm-config-v1";

const DEFAULT_TRUNK = { leaves: 0, roots: 0, flowers: 0, fruits: 0 };

const createInitialMessages = (mode) => [
    {
        id: `init-${Date.now()}`,
        role: "assistant",
        type: "text",
        text: MODE_OPENERS[mode] || MODE_OPENERS.free,
    },
];

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

function App() {
    const savedRef = useRef(safeLoad(STORAGE_KEY));
    const saved = savedRef.current;

    const userId = useMemo(() => getUserId(), []);

    const [storageMode, setStorageMode] = useState(() => saved?.storageMode || "local");
    const [incognitoMode, setIncognitoMode] = useState(() => loadIncognito());

    const [selectedMode, setSelectedMode] = useState(() => saved?.selectedMode || "free");
    const [messages, setMessages] = useState(() =>
        saved?.messages?.length ? saved.messages : createInitialMessages(saved?.selectedMode || "free")
    );
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messageCount, setMessageCount] = useState(() =>
        typeof saved?.messageCount === "number" ? saved.messageCount : 0
    );
    const [trunk, setTrunk] = useState(() => ({ ...DEFAULT_TRUNK, ...(saved?.trunk || {}) }));
    const [categories, setCategories] = useState(() => saved?.categories || null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
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
    const [returningMessage, setReturningMessage] = useState(null);

    const streamControllerRef = useRef(null);
    // Ref toujours synchronisé pour éviter les closures périmées sur les messages
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Message d'accueil au mount selon la durée d'absence
    useEffect(() => {
        if (!lastVisitDate) return;
        const days = daysSince(lastVisitDate);
        const msg = getReturningMessage(days);
        if (msg && messages.length <= 1) {
            setReturningMessage(msg);
            setMessages((prev) => [
                ...prev,
                {
                    id: `back-${Date.now()}`,
                    role: "assistant",
                    type: "text",
                    text: msg,
                },
            ]);
            setTimeout(() => setReturningMessage(null), 8000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persistance principale (hors incognito)
    useEffect(() => {
        if (incognitoMode) return;
        safeWrite(STORAGE_KEY, {
            messages,
            messageCount,
            trunk,
            categories,
            selectedMode,
            storageMode,
            lastVisitDate,
        });
    }, [messages, messageCount, trunk, categories, selectedMode, storageMode, incognitoMode, lastVisitDate]);

    useEffect(() => {
        if (incognitoMode) safeWrite(INCOGNITO_KEY, "1");
        else safeRemove(INCOGNITO_KEY);
    }, [incognitoMode]);

    useEffect(() => {
        safeWrite(LLM_KEY, llmConfig);
    }, [llmConfig]);

    // Récupération de la config par défaut au mount
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

    // Calcul du decay visuel (les stats réelles ne changent pas)
    const daysAbsent = useMemo(
        () => daysSince(lastVisitDate),
        [lastVisitDate]
    );
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
        // Stats brutes (pour debug / future export)
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
            const originX = 60;
            const heightFactor = Math.max(0, Math.min(1, (treeMeta.progress - 5) / 90));
            const originY = 125 - 8 - heightFactor * 75 + 4;
            const total = (cat.leaves || 0) + (cat.flowers || 0) + (cat.fruits || 0);
            const length = 18 + heightFactor * 14 + Math.min(total, 18) * 0.85;
            const tipX = originX + Math.cos(rad) * length;
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

    // Reply mocké (fallback)
    const runMockReply = useCallback(() => {
        setIsTyping(true);
        const delay = 1500 + Math.random() * 600;
        setTimeout(() => {
            const pool = MODE_RESPONSES[selectedMode] || MODE_RESPONSES.free;
            const reply = pool[Math.floor(Math.random() * pool.length)];
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    type: "text",
                    text: reply,
                },
            ]);
        }, delay);
    }, [selectedMode]);

    // Streaming depuis LM Studio. On lit messagesRef.current pour éviter les closures périmées.
    const startLLMStream = useCallback(
        (latestUserText) => {
            const history = messagesRef.current
                .filter((m) => m.type !== "crisis" && !m.streaming)
                .filter((m) => (m.text || "").trim().length > 0)
                .map((m) => ({ role: m.role, content: m.text }));
            history.push({ role: "user", content: latestUserText });

            const aiId = `a-${Date.now()}`;
            setMessages((prev) => [
                ...prev,
                {
                    id: aiId,
                    role: "assistant",
                    type: "text",
                    text: "",
                    streaming: true,
                },
            ]);
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
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === aiId ? { ...m, streaming: false } : m
                    )
                );
            };

            streamChat(
                {
                    messages: history,
                    mode: selectedMode,
                    categories: categories || [],
                    base_url: llmConfig.baseUrl,
                    model: llmConfig.model,
                },
                {
                    onDelta: (chunk) => {
                        if (crisisHit || errorHit) return;
                        buffer += chunk;
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === aiId ? { ...m, text: buffer } : m
                            )
                        );
                        setIsTyping(false);
                    },
                    onCrisis: (msg) => {
                        crisisHit = true;
                        setIsTyping(false);
                        setMessages((prev) =>
                            prev
                                .filter((m) => m.id !== aiId)
                                .concat({
                                    id: `c-${Date.now()}`,
                                    role: "assistant",
                                    type: "crisis",
                                    text: msg || CRISIS_MESSAGE,
                                })
                        );
                    },
                    onError: (err) => {
                        if (errorHit) return;
                        errorHit = true;
                        setIsTyping(false);
                        console.warn("[llm] error", err);
                        const pool = MODE_RESPONSES[selectedMode] || MODE_RESPONSES.free;
                        const fallback = pool[Math.floor(Math.random() * pool.length)];
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === aiId
                                    ? {
                                          ...m,
                                          text: fallback,
                                          streaming: false,
                                          llmError: err?.message || "LLM unreachable",
                                      }
                                    : m
                            )
                        );
                    },
                    onDone: finalize,
                }
            ).then((controller) => {
                streamControllerRef.current = controller;
            });
        },
        [selectedMode, categories, llmConfig]
    );

    const handleSend = useCallback(() => {
        const text = inputValue.trim();
        if (!text) return;

        const userMsg = {
            id: `u-${Date.now()}`,
            role: "user",
            type: "text",
            text,
            categoryId: selectedCategoryId || null,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setLastVisitDate(new Date().toISOString());

        const nextCount = messageCount + 1;
        setMessageCount(nextCount);

        const result = computeGrowth(
            trunk,
            categories,
            selectedMode,
            nextCount,
            selectedCategoryId
        );
        setTrunk(result.trunk);
        if (result.categories) setCategories(result.categories);
        showGrowth(result.growthEvents);

        if (selectedCategoryId && result.growthEvents.length > 0) {
            setTimeout(() => triggerFlyingLeaf(selectedCategoryId), 150);
        }

        setSelectedCategoryId(null);

        if (detectCrisis(text)) {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `c-${Date.now()}`,
                        role: "assistant",
                        type: "crisis",
                        text: CRISIS_MESSAGE,
                    },
                ]);
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
        messageCount,
        trunk,
        categories,
        selectedMode,
        selectedCategoryId,
        showGrowth,
        triggerFlyingLeaf,
        llmConfig.enabled,
        startLLMStream,
        runMockReply,
    ]);

    const handleSelectMode = useCallback(
        (mode) => {
            if (mode === selectedMode) return;
            setSelectedMode(mode);
            setMessages((prev) => [
                ...prev,
                {
                    id: `mode-${Date.now()}`,
                    role: "assistant",
                    type: "text",
                    text: MODE_OPENERS[mode],
                },
            ]);
            setSidebarOpen(false);
        },
        [selectedMode]
    );

    const handleNewReflection = useCallback(() => {
        streamControllerRef.current?.abort();
        setMessages(createInitialMessages(selectedMode));
        setInputValue("");
        setSelectedCategoryId(null);
        setSidebarOpen(false);
    }, [selectedMode]);

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
                selectedMode,
                messages,
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
    }, [selectedMode, messages, messageCount, trunk, categories, lastVisitDate]);

    const handleClearAll = useCallback(() => {
        const confirmed = window.confirm(
            "Veux-tu vraiment supprimer toutes tes données locales ? Ton arbre reviendra à une graine endormie."
        );
        if (!confirmed) return;
        safeRemove(STORAGE_KEY);
        setMessages(createInitialMessages(selectedMode));
        setMessageCount(0);
        setTrunk(DEFAULT_TRUNK);
        setCategories(null);
        setLastVisitDate(null);
        setShowLocalSettings(false);
        setOnboardingIsFirstTime(true);
        setShowOnboarding(true);
    }, [selectedMode]);

    return (
        <div className="App flex" style={{ backgroundColor: "#FAF9F6" }}>
            <Sidebar
                selectedMode={selectedMode}
                onSelectMode={handleSelectMode}
                onNewReflection={handleNewReflection}
                treeStats={treeStats}
                onOpenEmergency={() => setShowEmergencyCard(true)}
                onOpenSettings={() => setShowLocalSettings(true)}
                onOpenEvolution={() => setShowEvolution(true)}
                onOpenCategoryEditor={handleOpenCategoryEditor}
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

            <GrowthToast message={growthToast || returningMessage} />

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
