import { useEffect, useRef } from "react";
import { Menu, Lock } from "lucide-react";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { InnerTreeSvg } from "./InnerTreeSvg";
import { MODE_LABELS, MODE_SUBTITLES } from "../lib/responses";

export const ChatArea = ({
    messages,
    isTyping,
    mode,
    treeStats,
    onOpenSidebar,
    onOpenEmergency,
    onOpenEvolution,
}) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, isTyping]);

    // Affichage "hero" de l'arbre : tant que la conversation est très courte,
    // on lui donne toute la place pour qu'on ait vraiment envie de le regarder grandir.
    const isEarly = messages.length <= 1 && !isTyping;

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0" data-testid="chat-area">
            {/* Header chat */}
            <header className="px-4 md:px-8 pt-5 pb-3 flex items-start gap-3">
                <button
                    onClick={onOpenSidebar}
                    className="md:hidden p-2 -ml-2 text-stone-600 hover:text-stone-800"
                    data-testid="open-sidebar-btn"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2
                            className="font-serif-reading text-xl md:text-2xl text-stone-800"
                            data-testid="mode-title"
                        >
                            {MODE_LABELS[mode]}
                        </h2>
                        <span
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-sans-ui"
                            style={{
                                backgroundColor: "rgba(143, 151, 121, 0.12)",
                                color: "#6B7361",
                            }}
                            data-testid="local-badge"
                        >
                            <Lock className="w-2.5 h-2.5" />
                            Données locales simulées
                        </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1 font-sans-ui">
                        {MODE_SUBTITLES[mode]}
                    </p>
                </div>

                {/* Mini-arbre en haut à droite, toujours visible quand la conversation continue */}
                {!isEarly && (
                    <button
                        onClick={onOpenEvolution}
                        data-testid="chat-tree-mini"
                        className="hidden md:flex w-20 h-24 shrink-0 -mt-2 transition-transform hover:scale-105"
                        aria-label="Voir mon évolution"
                    >
                        <InnerTreeSvg
                            stageKey={treeStats.stageKey}
                            progress={treeStats.progress}
                            season={treeStats.season}
                            leaves={treeStats.leaves}
                            roots={treeStats.roots}
                            flowers={treeStats.flowers}
                            fruits={treeStats.fruits}
                            messageCount={treeStats.messageCount}
                            categories={treeStats.categories}
                            seed={treeStats.seed}
                            branchShrink={treeStats.branchShrink}
                            showLabels={false}
                            breathe={false}
                        />
                    </button>
                )}
            </header>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-soft px-4 md:px-8"
                data-testid="messages-container"
            >
                <div className="max-w-3xl mx-auto py-6 space-y-7">
                    {/* Arbre hero — visible quand la conversation démarre */}
                    {isEarly && (
                        <button
                            onClick={onOpenEvolution}
                            data-testid="chat-tree-hero"
                            className="block w-full mx-auto mb-4 animate-soft-in"
                            aria-label="Voir mon évolution"
                        >
                            <div className="mx-auto w-72 h-80 md:w-96 md:h-[26rem]">
                                <InnerTreeSvg
                                    stageKey={treeStats.stageKey}
                                    progress={treeStats.progress}
                                    season={treeStats.season}
                                    leaves={treeStats.leaves}
                                    roots={treeStats.roots}
                                    flowers={treeStats.flowers}
                                    fruits={treeStats.fruits}
                                    messageCount={treeStats.messageCount}
                                    categories={treeStats.categories}
                                    seed={treeStats.seed}
                                    branchShrink={treeStats.branchShrink}
                                    showLabels={true}
                                    className="w-full h-full"
                                />
                            </div>
                            <p className="text-center text-sm text-stone-500 italic font-serif-reading mt-2">
                                {treeStats.stage} · {treeStats.season}
                            </p>
                        </button>
                    )}

                    {messages.map((m) => (
                        <MessageBubble
                            key={m.id}
                            message={m}
                            onOpenEmergency={onOpenEmergency}
                        />
                    ))}
                    {isTyping && <TypingIndicator />}
                </div>
            </div>
        </div>
    );
};
