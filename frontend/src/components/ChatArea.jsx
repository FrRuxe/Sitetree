import { useEffect, useRef } from "react";
import { Menu, Lock } from "lucide-react";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { MODE_LABELS, MODE_SUBTITLES } from "../lib/responses";

export const ChatArea = ({
    messages,
    isTyping,
    mode,
    onOpenSidebar,
    onOpenEmergency,
}) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, isTyping]);

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
            </header>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-soft px-4 md:px-8"
                data-testid="messages-container"
            >
                <div className="max-w-3xl mx-auto py-6 space-y-7">
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
