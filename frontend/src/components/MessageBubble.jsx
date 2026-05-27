import { EmergencySupportCard } from "./EmergencySupportCard";

export const MessageBubble = ({ message, onOpenEmergency }) => {
    if (message.type === "crisis") {
        return (
            <div className="animate-soft-in" data-testid="message-crisis">
                <EmergencySupportCard text={message.text} onOpenEmergency={onOpenEmergency} inline />
            </div>
        );
    }

    if (message.role === "assistant") {
        return (
            <div className="animate-soft-in" data-testid="message-ai">
                <div className="flex items-baseline gap-3">
                    <span
                        className="text-base shrink-0 leading-none mt-2 select-none"
                        style={{ color: "#8F9779" }}
                        aria-hidden="true"
                    >
                        ✧
                    </span>
                    <p className="font-serif-reading text-lg leading-loose text-stone-800 whitespace-pre-wrap">
                        {message.text}
                        {message.streaming && (
                            <span
                                className="inline-block w-[2px] h-[1em] align-text-bottom ml-0.5"
                                style={{
                                    backgroundColor: "#8F9779",
                                    animation: "gentlePulse 1s ease-in-out infinite",
                                }}
                            />
                        )}
                    </p>
                </div>
                {message.llmError && (
                    <p
                        className="ml-7 mt-2 text-xs text-stone-500 italic font-sans-ui"
                        data-testid="llm-error-notice"
                    >
                        ↳ Mode démo activé (LLM local injoignable).
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex justify-end animate-soft-in" data-testid="message-user">
            <div className="max-w-[78%] bg-stone-200 text-stone-800 rounded-2xl rounded-tr-none px-5 py-3 font-sans-ui text-[15px] leading-relaxed whitespace-pre-wrap">
                {message.text}
            </div>
        </div>
    );
};

export const TypingIndicator = () => (
    <div className="flex items-center gap-3 animate-soft-in" data-testid="typing-indicator">
        <span
            className="text-base leading-none select-none"
            style={{ color: "#8F9779" }}
            aria-hidden="true"
        >
            ✧
        </span>
        <span className="dot-pulse">
            <span /> <span /> <span />
        </span>
        <span className="text-sm text-stone-500 italic font-serif-reading">
            Luma écrit…
        </span>
    </div>
);
