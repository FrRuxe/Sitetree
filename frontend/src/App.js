import { useState, useEffect, useRef, useCallback } from "react";
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
} from "@/lib/treeLogic";
import { streamChat, fetchLLMConfig } from "@/lib/api";
import { getBranchAngles } from "@/lib/categories";

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

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const loadIncognito = () => {
    try {
        return localStorage.getItem(INCOGNITO_KEY) === "1";
    } catch {
        return false;
    }
};

const loadLlmConfig = () => {
    try {
        const raw = localStorage.getItem(LLM_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function App() {
    const savedRef = useRef(loadFromStorage());
    const saved = savedRef.current;

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

    const [llmConfig, setLlmConfig] = useState(() => {
        const cfg = loadLlmConfig();
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

    // Persistance principale
    useEffect(() => {
        if (incognitoMode) return;
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    messages,
                    messageCount,
                    trunk,
                    categories,
                    selectedMode,
                    storageMode,
                })
            );
        } catch {}
    }, [messages, messageCount, trunk, categories, selectedMode, storageMode, incognitoMode]);

    useEffect(() => {
        try {
            if (incognitoMode) localStorage.setItem(INCOGNITO_KEY, "1");
            else localStorage.removeItem(INCOGNITO_KEY);
        } catch {}
    }, [incognitoMode]);

    useEffect(() => {
        try {
            localStorage.setItem(LLM_KEY, JSON.stringify(llmConfig));
        } catch {}
    }, [llmConfig]);

    // Récupération de la config par défaut au mount (silencieux si offline)
    useEffect(() => {
        fetchLLMConfig().then((cfg) => {
            if (!cfg) return;
            // On ne pousse la config serveur que si l'utilisateur n'en a pas déjà une
            const local = loadLlmConfig();
            if (!local) {
                setLlmConfig((prev) => ({
                    ...prev,
                    baseUrl: cfg.base_url || prev.baseUrl,
                    model: cfg.model || prev.model,
                }));
            }
        });
    }, []);

    const treeMeta = getStageFromCount(messageCount);
    const aggregated = aggregateStats(trunk, categories);
    const treeStats = {
        ...treeMeta,
        stageKey: treeMeta.key,
        ...aggregated,
        trunk,
        categories: categories || [],
    };

    const showGrowth = useCallback((events) => {
        if (!events?.length) return;
        setGrowthToast(events[0]);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setGrowthToast(null), 3200);
    }, []);

    // Lance l'animation d'une feuille volante depuis l'input vers le bout de la branche
    const triggerFlyingLeaf = useCallback((categoryId) => {
        if (!categoryId || !categories) return;
        const idx = categories.findIndex((c) => c.id === categoryId);
        if (idx < 0) return;
        const cat = categories[idx];
        const angles = getBranchAngles(categories.length);
        const angle = angles[idx];

        // Position de départ : centre du champ de saisie
        const input = document.querySelector('[data-testid="chat-input-container"]');
        const inputRect = input?.getBoundingClientRect();
        if (!inputRect) return;
        const from = {
            x: inputRect.left + inputRect.width / 2 - 11,
            y: inputRect.top + 10,
        };

        // Position d'arrivée : bout de la branche sur le SVG visible
        const svg = document.querySelector('[data-tree-svg="true"]');
        if (!svg) return;
        const svgRect = svg.getBoundingClientRect();
        const vbW = 120;
        const vbH = 140;
        const sx = svgRect.width / vbW;
        const sy = svgRect.height / vbH;

        // Mêmes calculs que dans le composant SVG
        const rad = ((angle - 90) * Math.PI) / 180;
        const originX = 60;
        const originY =
            treeMeta.key === "sprout" ? 92 : treeMeta.key === "growing" ? 70 : 60;
        const total = cat.leaves + cat.flowers + cat.fruits;
        const length = 22 + Math.min(total, 18) * 0.9;
        const tipX = originX + Math.cos(rad) * length;
        const tipY = originY + Math.sin(rad) * length;

        const to = {
            x: svgRect.left + tipX * sx - 11,
            y: svgRect.top + tipY * sy - 11,
        };

        const id = `leaf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setFlyingLeaves((prev) => [...prev, { id, from, to, color: cat.color }]);
    }, [categories, treeMeta.key]);

    const removeFlyingLeaf = useCallback((id) => {
        setFlyingLeaves((prev) => prev.filter((l) => l.id !== id));
    }, []);

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

        const nextCount = messageCount + 1;
        setMessageCount(nextCount);

        // Croissance arbre
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

        // Animation feuille volante (après un petit délai pour laisser le DOM se mettre à jour)
        if (selectedCategoryId) {
            setTimeout(() => triggerFlyingLeaf(selectedCategoryId), 120);
        }

        const targetCategoryId = selectedCategoryId;
        setSelectedCategoryId(null);

        // Crise détectée localement → on bypass le LLM
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

        // Si LLM local actif → streaming
        if (llmConfig.enabled) {
            startLLMStream(targetCategoryId);
        } else {
            runMockReply();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue, messageCount, trunk, categories, selectedMode, selectedCategoryId, showGrowth, triggerFlyingLeaf, llmConfig]);

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

    // Streaming depuis LM Studio
    const startLLMStream = useCallback(
        (_targetCategoryId) => {
            // Construire les messages pour le LLM (on n'envoie pas les types crise/system)
            const llmHistory = messages
                .filter((m) => m.type !== "crisis")
                .map((m) => ({ role: m.role, content: m.text }));
            // Ajouter le dernier message utilisateur (qui vient juste d'être ajouté en state)
            llmHistory.push({ role: "user", content: inputValue.trim() });

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

            // Annule un éventuel stream précédent
            streamControllerRef.current?.abort();

            let buffer = "";
            let crisisHit = false;
            let errorHit = false;
            streamChat(
                {
                    messages: llmHistory,
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
                        // Fallback : on remplace le message vide par un mock
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
                    onDone: () => {
                        setIsTyping(false);
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === aiId ? { ...m, streaming: false } : m
                            )
                        );
                    },
                }
            ).then((controller) => {
                streamControllerRef.current = controller;
            });
        },
        [messages, inputValue, selectedMode, categories, llmConfig]
    );

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
        } catch {}
    }, [selectedMode, messages, messageCount, trunk, categories]);

    const handleClearAll = useCallback(() => {
        const confirmed = window.confirm(
            "Veux-tu vraiment supprimer toutes tes données locales ? Ton arbre reviendra à une graine endormie."
        );
        if (!confirmed) return;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setMessages(createInitialMessages(selectedMode));
        setMessageCount(0);
        setTrunk(DEFAULT_TRUNK);
        setCategories(null);
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
