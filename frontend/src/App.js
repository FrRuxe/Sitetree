import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";

import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { EmergencySupportCard } from "@/components/EmergencySupportCard";
import { LocalSettingsPanel } from "@/components/LocalSettingsPanel";
import { InnerGardenEvolution } from "@/components/InnerGardenEvolution";
import { GrowthToast } from "@/components/GrowthToast";

import {
    MODE_RESPONSES,
    MODE_OPENERS,
    CRISIS_MESSAGE,
} from "@/lib/responses";
import {
    getStageFromCount,
    detectCrisis,
    computeGrowth,
} from "@/lib/treeLogic";

const STORAGE_KEY = "jardin-interieur-state-v1";
const INCOGNITO_KEY = "jardin-interieur-incognito-v1";

const DEFAULT_STATS = {
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
    // Hydratation paresseuse : on évite toute race condition entre les effets.
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
    const [stats, setStats] = useState(() => ({
        ...DEFAULT_STATS,
        ...(saved?.stats || {}),
    }));

    const [showEmergencyCard, setShowEmergencyCard] = useState(false);
    const [showLocalSettings, setShowLocalSettings] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [growthToast, setGrowthToast] = useState(null);
    const toastTimerRef = useRef(null);

    // Persistance de l'état principal — uniquement quand l'incognito est OFF.
    useEffect(() => {
        if (incognitoMode) return;
        try {
            const payload = {
                messages,
                messageCount,
                stats,
                selectedMode,
                storageMode,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // silencieux
        }
    }, [messages, messageCount, stats, selectedMode, storageMode, incognitoMode]);

    // Persistance séparée du choix incognito (toujours respectée)
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
    const treeStats = {
        ...treeMeta,
        stageKey: treeMeta.key,
        ...stats,
    };

    const showGrowth = useCallback((events) => {
        if (!events?.length) return;
        const msg = events[0];
        setGrowthToast(msg);
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
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");

        const nextCount = messageCount + 1;
        setMessageCount(nextCount);

        // Croissance arbre
        const { newStats, growthEvents } = computeGrowth(stats, selectedMode, nextCount);
        setStats(newStats);
        showGrowth(growthEvents);

        // Détection de crise
        if (detectCrisis(text)) {
            // Pause très courte pour la lisibilité
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
    }, [inputValue, messageCount, stats, selectedMode, showGrowth]);

    const handleSelectMode = useCallback(
        (mode) => {
            if (mode === selectedMode) return;
            setSelectedMode(mode);
            // Ajoute un message d'ouverture du nouveau mode
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
        // L'arbre ne meurt jamais : on conserve stats & messageCount.
        setInputValue("");
        setSidebarOpen(false);
    }, [selectedMode]);

    const handleExport = useCallback(() => {
        try {
            const payload = {
                exportedAt: new Date().toISOString(),
                selectedMode,
                messages,
                messageCount,
                stats,
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
    }, [selectedMode, messages, messageCount, stats]);

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
        setStats(DEFAULT_STATS);
        setShowLocalSettings(false);
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
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
                <ChatArea
                    messages={messages}
                    isTyping={isTyping}
                    mode={selectedMode}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    onOpenEmergency={() => setShowEmergencyCard(true)}
                />
                <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    mode={selectedMode}
                    disabled={isTyping}
                    incognito={incognitoMode}
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
                />
            )}

            <GrowthToast message={growthToast} />
        </div>
    );
}

export default App;
