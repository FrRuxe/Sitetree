import { MessageCircle, Moon, Repeat, Sparkles } from "lucide-react";
import { MODE_LABELS } from "../lib/responses";

const MODE_ICONS = {
    free: MessageCircle,
    daily: Moon,
    rumination: Repeat,
    light: Sparkles,
};

const MODES = ["free", "daily", "rumination", "light"];

export const ModeSelector = ({ selectedMode, onSelect }) => {
    return (
        <div className="space-y-1" data-testid="mode-selector">
            <p className="text-xs uppercase tracking-wider text-stone-500 px-3 mb-2 font-sans-ui">
                Modes d'écoute
            </p>
            {MODES.map((mode) => {
                const Icon = MODE_ICONS[mode];
                const isActive = mode === selectedMode;
                return (
                    <button
                        key={mode}
                        data-testid={`mode-${mode}`}
                        onClick={() => onSelect(mode)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 font-sans-ui text-sm ${
                            isActive
                                ? "text-stone-800"
                                : "text-stone-600 hover:bg-stone-200/40"
                        }`}
                        style={
                            isActive
                                ? { backgroundColor: "rgba(143, 151, 121, 0.15)" }
                                : undefined
                        }
                    >
                        <Icon
                            className="w-4 h-4 shrink-0"
                            style={{ color: isActive ? "#8F9779" : undefined }}
                        />
                        <span>{MODE_LABELS[mode]}</span>
                    </button>
                );
            })}
        </div>
    );
};
