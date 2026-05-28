import { useState, useEffect } from "react";
import { Loader2, Cpu, AlertCircle, CircleCheck, Cloud, Server } from "lucide-react";
import {
    initWebLLMEngine,
    isWebGPUAvailable,
    isEngineReady,
    getCurrentEngineModel,
    disposeEngine,
} from "../lib/webllm";

export const WebLLMSection = ({ llmConfig, onUpdate }) => {
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [phase, setPhase] = useState(() =>
        isEngineReady(llmConfig.webllmModel) ? "ready" : "idle"
    );
    const [error, setError] = useState("");
    const [localModelId, setLocalModelId] = useState(
        llmConfig.webllmModel || "gemma-3-4b-it-q4f16_1-MLC"
    );

    const webgpuOk = isWebGPUAvailable();

    useEffect(() => {
        // Si l'utilisateur active WebLLM et que le moteur est déjà prêt avec le bon modèle
        if (llmConfig.provider === "webllm" && isEngineReady(localModelId)) {
            setPhase("ready");
        }
    }, [llmConfig.provider, localModelId]);

    const handleInit = async () => {
        setError("");
        setPhase("loading");
        setProgress(0);
        setProgressText("Préparation du moteur…");
        try {
            await initWebLLMEngine(localModelId, (p) => {
                setProgress(p.progress || 0);
                setProgressText(p.text || "");
            });
            setPhase("ready");
            onUpdate({ ...llmConfig, webllmModel: localModelId, provider: "webllm" });
        } catch (e) {
            console.warn("[webllm] init error", e);
            setError(e.message || "Échec du chargement.");
            setPhase("error");
        }
    };

    const handleUnload = async () => {
        await disposeEngine();
        setPhase("idle");
        setProgress(0);
        setProgressText("");
    };

    return (
        <div className="py-3 border-b border-stone-200/70 space-y-2.5">
            {!webgpuOk && (
                <div
                    className="rounded-xl p-3 flex items-start gap-2 text-xs font-sans-ui"
                    style={{ backgroundColor: "#FBF1F1", color: "#9F3645" }}
                >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                        WebGPU n'est pas disponible sur ce navigateur. Pour utiliser
                        WebLLM, ouvre l'app dans <strong>Chrome</strong>, <strong>Edge</strong> ou
                        <strong> Brave</strong> récents.
                    </span>
                </div>
            )}

            <label className="block">
                <span className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                    Modèle WebLLM
                </span>
                <input
                    data-testid="webllm-model"
                    value={localModelId}
                    onChange={(e) => setLocalModelId(e.target.value)}
                    placeholder="gemma-3-4b-it-q4f16_1-MLC"
                    disabled={phase === "loading" || !webgpuOk}
                    className="mt-1 w-full bg-stone-100/60 rounded-xl px-3 py-2 text-sm font-mono outline-none border border-stone-200 focus:border-stone-400 disabled:opacity-50"
                />
                <span className="block mt-1 text-[11px] text-stone-500 italic font-sans-ui leading-relaxed">
                    L'ID exact des builds compilés est listé dans la documentation
                    @mlc-ai/web-llm. Si Gemma 4 E4B est publié, son ID y figurera.
                </span>
            </label>

            {phase === "loading" && (
                <div data-testid="webllm-progress" className="space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-stone-200/70 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.round(progress * 100)}%`,
                                backgroundColor: "#8F9779",
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-sans-ui">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="truncate">
                            {Math.round(progress * 100)}% — {progressText || "…"}
                        </span>
                    </div>
                </div>
            )}

            {phase === "ready" && (
                <div
                    className="flex items-center gap-1.5 text-xs font-sans-ui"
                    style={{ color: "#6F8B6A" }}
                    data-testid="webllm-ready"
                >
                    <CircleCheck className="w-3.5 h-3.5" />
                    Moteur prêt — modèle <span className="font-mono">{getCurrentEngineModel()}</span> chargé en mémoire.
                </div>
            )}

            {phase === "error" && error && (
                <div
                    className="rounded-xl p-3 text-xs font-sans-ui"
                    style={{ backgroundColor: "#FBF1F1", color: "#9F3645" }}
                    data-testid="webllm-error"
                >
                    {error}
                </div>
            )}

            <div className="flex gap-2">
                {phase !== "ready" && (
                    <button
                        onClick={handleInit}
                        data-testid="webllm-init-btn"
                        disabled={phase === "loading" || !webgpuOk || !localModelId.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium font-sans-ui transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: "#8F9779", color: "#FAF9F6" }}
                    >
                        <Cpu className="w-3.5 h-3.5" />
                        {phase === "loading" ? "Téléchargement…" : "Initialiser l'IA locale"}
                    </button>
                )}
                {phase === "ready" && (
                    <button
                        onClick={handleUnload}
                        data-testid="webllm-unload-btn"
                        className="text-xs text-stone-500 hover:text-stone-800 font-sans-ui"
                    >
                        Décharger
                    </button>
                )}
            </div>
        </div>
    );
};

const Toggle = ({ checked, onChange, disabled, testid }) => (
    <button
        data-testid={testid}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{ backgroundColor: checked ? "#8F9779" : "#D6CFC2" }}
        aria-pressed={checked}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-stone-50 transition-transform shadow-sm ${
                checked ? "translate-x-4" : "translate-x-0.5"
            }`}
        />
    </button>
);
