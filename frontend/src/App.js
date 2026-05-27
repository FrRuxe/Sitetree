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

const STORAGE_KEY = "jardin-interieur-state-v2";
const INCOGNITO_KEY = "jardin-interieur-incognito-v1";

const DEFAULT_TRUNK = {
    leaves: 0,
    roots: 0,
    flowers: 0,
    fruits: 0,
};

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
        if (!raw) return null;
        return JSON.parse(raw);
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
    const [trunk, setTrunk] = useState(() => ({
        ...DEFAULT_TRUNK,
        ...(saved?.trunk || {}),
    }));
    const [categories, setCategories] = useState(() => saved?.categories || null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const [showOnboarding, setShowOnboarding] = useState(() => !saved?.categories);
    const [onboardingIsFirstTime, setOnboardingIsFirstTime] = useState(() => !saved?.categories);
    const [showEmergencyCard, setShowEmergencyCard] = useState(false);
    const [showLocalSettings, setShowLocalSettings] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [growthToast, setGrowthToast] = useState(null);
    const toastTimerRef = useRef(null);

    // Persistance de l'état principal (hors incognito)
    useEffect(() => {
        if (incognitoMode) return;
        try {
            const payload = {
                messages,
                messageCount,
                trunk,
                categories,
                selectedMode,
                storageMode,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // silencieux
        }
    }, [messages, messageCount, trunk, categories, selectedMode, storageMode, incognitoMode]);

    // Persistance séparée du choix incognito
    useEffect(() => {
        try {
            if (incognitoMode) {
                localStorage.setItem(INCOGNITO_KEY, "1");
            } else {
                localStorage.removeItem(INCOGNITO_KEY);
            }
        } catch {
            // silencieux
        }
    }, [incognitoMode]);

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

        // Croissance arbre (par catégorie si tag, sinon tronc)
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

        // Reset du chip après envoi
        setSelectedCategoryId(null);

        // Détection de crise
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
            }, 600);
            return;
        }

        // Réponse simulée
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
    }, [inputValue, messageCount, trunk, categories, selectedMode, selectedCategoryId, showGrowth]);

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
        } catch {
            // silencieux
        }
    }, [selectedMode, messages, messageCount, trunk, categories]);

    const handleClearAll = useCallback(() => {
        const confirmed = window.confirm(
            "Veux-tu vraiment supprimer toutes tes données locales ? Ton arbre reviendra à une graine endormie."
        );
        if (!confirmed) return;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // silencieux
        }
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
                    disabled={isTyping}
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
        </div>
    );
}

export default App;
