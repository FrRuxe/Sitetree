import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { MessageCircle, Moon, Repeat, Sparkles } from "lucide-react";
import { MODE_LABELS, MODE_SUBTITLES } from "../lib/responses";

const MODE_ICONS = {
    free: MessageCircle,
    daily: Moon,
    rumination: Repeat,
    light: Sparkles,
};

const MODES = ["free", "daily", "rumination", "light"];

export const ModeDropdown = ({ selectedMode, onSelect, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onEsc = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    const ActiveIcon = MODE_ICONS[selectedMode];

    return (
        <div className="relative" ref={wrapperRef} data-testid="mode-dropdown">
            <p className="text-xs uppercase tracking-wider text-stone-500 px-3 mb-2 font-sans-ui">
                Mode d'écoute
            </p>
            <button
                onClick={() => !disabled && setOpen((v) => !v)}
                disabled={disabled}
                data-testid="mode-dropdown-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors font-sans-ui ${
                    open ? "bg-stone-200/40" : "hover:bg-stone-200/30"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{
                    backgroundColor: open
                        ? "rgba(143, 151, 121, 0.15)"
                        : "rgba(143, 151, 121, 0.08)",
                }}
            >
                <ActiveIcon className="w-4 h-4 shrink-0" style={{ color: "#8F9779" }} />
                <span className="flex-1 min-w-0">
                    <span className="block text-sm text-stone-800 leading-tight">
                        {MODE_LABELS[selectedMode]}
                    </span>
                    <span className="block text-[11px] text-stone-500 leading-tight mt-0.5">
                        {MODE_SUBTITLES[selectedMode]}
                    </span>
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    data-testid="mode-dropdown-menu"
                    className="absolute z-30 mt-1.5 left-0 right-0 rounded-2xl border border-stone-200 shadow-md overflow-hidden animate-soft-in"
                    style={{ backgroundColor: "#FAF9F6" }}
                >
                    {MODES.map((mode) => {
                        const Icon = MODE_ICONS[mode];
                        const isSelected = mode === selectedMode;
                        return (
                            <button
                                key={mode}
                                role="option"
                                aria-selected={isSelected}
                                data-testid={`mode-option-${mode}`}
                                onClick={() => {
                                    onSelect(mode);
                                    setOpen(false);
                                }}
                                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-stone-100/70 transition-colors"
                            >
                                <Icon
                                    className="w-4 h-4 shrink-0 mt-0.5"
                                    style={{ color: "#8F9779" }}
                                />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm text-stone-800 font-sans-ui">
                                        {MODE_LABELS[mode]}
                                    </span>
                                    <span className="block text-[11px] text-stone-500 font-sans-ui leading-snug mt-0.5">
                                        {MODE_SUBTITLES[mode]}
                                    </span>
                                </span>
                                {isSelected && (
                                    <Check
                                        className="w-3.5 h-3.5 shrink-0 mt-1"
                                        style={{ color: "#8F9779" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
