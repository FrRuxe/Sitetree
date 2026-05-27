import { useRef, useEffect } from "react";
import { ArrowUp, EyeOff } from "lucide-react";
import { MODE_PLACEHOLDERS } from "../lib/responses";

export const ChatInput = ({
    value,
    onChange,
    onSend,
    mode,
    disabled,
    incognito,
}) => {
    const textareaRef = useRef(null);

    // Auto-resize doux
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [value]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) onSend();
        }
    };

    const hasContent = value.trim().length > 0;

    return (
        <div className="px-4 md:px-8 pb-5 pt-3" data-testid="chat-input-container">
            <div className="max-w-3xl mx-auto">
                {incognito && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-stone-500 italic font-sans-ui">
                        <EyeOff className="w-3 h-3" />
                        Mode incognito actif — rien n'est conservé.
                    </div>
                )}
                <div
                    className="relative rounded-3xl border border-stone-200 transition-all duration-200 focus-within:border-stone-300 focus-within:shadow-sm"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.45)" }}
                >
                    <textarea
                        ref={textareaRef}
                        data-testid="chat-input"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder={MODE_PLACEHOLDERS[mode]}
                        disabled={disabled}
                        className="w-full resize-none bg-transparent px-5 py-4 pr-14 outline-none text-[15px] text-stone-800 placeholder:text-stone-400 font-sans-ui leading-relaxed disabled:opacity-50"
                        style={{ maxHeight: "200px" }}
                    />
                    <button
                        data-testid="send-btn"
                        onClick={() => hasContent && !disabled && onSend()}
                        aria-label="Envoyer"
                        className={`absolute right-3 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                            hasContent && !disabled
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-90 pointer-events-none"
                        }`}
                        style={{
                            backgroundColor: "#8F9779",
                            color: "#FAF9F6",
                        }}
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-2.5 text-[11px] text-stone-400 text-center font-sans-ui">
                    Cet espace ne remplace pas un professionnel de santé. En cas d'urgence,
                    appelle le 3114.
                </p>
            </div>
        </div>
    );
};
