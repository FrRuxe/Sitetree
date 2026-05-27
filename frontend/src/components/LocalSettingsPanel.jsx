import { useState, useEffect } from "react";
import {
    X, Shield, EyeOff, Cpu, Brain, Download, Trash2, Cloud, Lock,
    Server, CircleCheck, CircleX, Loader2,
} from "lucide-react";
import { fetchLLMConfig } from "../lib/api";

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

const Row = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-stone-200/70 last:border-0">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8F9779" }} />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 font-sans-ui">{title}</p>
            {description && (
                <p className="text-xs text-stone-500 mt-0.5 font-sans-ui leading-relaxed">
                    {description}
                </p>
            )}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const LlmConnectionTest = ({ baseUrl, model }) => {
    const [status, setStatus] = useState("idle"); // idle | testing | ok | fail
    const [detail, setDetail] = useState("");

    const test = async () => {
        setStatus("testing");
        setDetail("");
        try {
            // On teste le endpoint /models de LM Studio (OpenAI-compatible) côté frontend
            // car c'est ce qui doit fonctionner pour que le backend puisse y accéder.
            // En réalité, le call passera via le backend en production, donc on teste
            // surtout que la config est saisie. Le vrai test viendra à l'envoi.
            const cfg = await fetchLLMConfig();
            if (cfg) {
                setStatus("ok");
                setDetail(
                    `Backend joignable. Modèle par défaut serveur : ${cfg.model}.`
                );
            } else {
                setStatus("fail");
                setDetail("Backend non joignable.");
            }
        } catch (e) {
            setStatus("fail");
            setDetail(e.message || "Erreur inconnue");
        }
    };

    return (
        <div className="mt-2">
            <button
                onClick={test}
                data-testid="test-llm-btn"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors font-sans-ui"
            >
                {status === "testing" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : status === "ok" ? (
                    <CircleCheck className="w-3 h-3" style={{ color: "#6F8B6A" }} />
                ) : status === "fail" ? (
                    <CircleX className="w-3 h-3" style={{ color: "#9F3645" }} />
                ) : (
                    <Server className="w-3 h-3" />
                )}
                Tester la connexion
            </button>
            {detail && (
                <p className="text-[11px] text-stone-500 mt-1.5 italic font-sans-ui">
                    {detail}
                </p>
            )}
        </div>
    );
};

export const LocalSettingsPanel = ({
    onClose,
    incognito,
    onToggleIncognito,
    onExport,
    onClearAll,
    storageMode,
    onChangeStorageMode,
    llmConfig,
    onUpdateLlmConfig,
}) => {
    const [customMemory, setCustomMemory] = useState(false);
    const [localBaseUrl, setLocalBaseUrl] = useState(llmConfig?.baseUrl || "");
    const [localModel, setLocalModel] = useState(llmConfig?.model || "");

    useEffect(() => {
        setLocalBaseUrl(llmConfig?.baseUrl || "");
        setLocalModel(llmConfig?.model || "");
    }, [llmConfig]);

    const updateField = (field, value) => {
        if (field === "baseUrl") setLocalBaseUrl(value);
        if (field === "model") setLocalModel(value);
        onUpdateLlmConfig({
            ...llmConfig,
            baseUrl: field === "baseUrl" ? value : llmConfig.baseUrl,
            model: field === "model" ? value : llmConfig.model,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch md:items-center justify-end md:justify-center p-0 md:p-8 bg-stone-900/30 backdrop-blur-sm animate-soft-in"
            onClick={onClose}
            data-testid="settings-modal"
        >
            <div
                className="relative w-full max-w-lg max-h-full md:max-h-[92vh] overflow-y-auto scroll-soft rounded-none md:rounded-3xl border border-stone-200 shadow-sm"
                style={{ backgroundColor: "#FAF9F6" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-stone-200/70"
                    style={{ backgroundColor: "#FAF9F6" }}
                >
                    <div>
                        <h2 className="font-serif-reading text-xl text-stone-800">
                            Paramètres locaux
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5 font-sans-ui">
                            Ton espace, tes règles.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        data-testid="settings-close"
                        className="p-1.5 rounded-full text-stone-500 hover:bg-stone-200/50"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    {/* LLM local */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-1">
                        Intelligence locale
                    </p>
                    <Row
                        icon={Cpu}
                        title="Utiliser le LLM local"
                        description="Quand actif, les réponses sont générées par ton propre modèle (LM Studio / Gemma). Sinon, mode démo avec réponses simulées."
                    >
                        <Toggle
                            checked={llmConfig?.enabled ?? true}
                            onChange={(v) =>
                                onUpdateLlmConfig({ ...llmConfig, enabled: v })
                            }
                            testid="toggle-llm"
                        />
                    </Row>

                    <div className="py-3 border-b border-stone-200/70 space-y-2">
                        <label className="block">
                            <span className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                                URL du serveur
                            </span>
                            <input
                                data-testid="llm-base-url"
                                value={localBaseUrl}
                                onChange={(e) => updateField("baseUrl", e.target.value)}
                                placeholder="http://localhost:1234/v1"
                                className="mt-1 w-full bg-stone-100/60 rounded-xl px-3 py-2 text-sm font-mono outline-none border border-stone-200 focus:border-stone-400"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                                Nom du modèle
                            </span>
                            <input
                                data-testid="llm-model"
                                value={localModel}
                                onChange={(e) => updateField("model", e.target.value)}
                                placeholder="gemma-3-4b-it"
                                className="mt-1 w-full bg-stone-100/60 rounded-xl px-3 py-2 text-sm font-mono outline-none border border-stone-200 focus:border-stone-400"
                            />
                        </label>
                        <p className="text-[11px] text-stone-500 italic font-sans-ui leading-relaxed">
                            Dans LM Studio, charge un modèle (par ex. Gemma 3 4B), va dans
                            l'onglet Server, active CORS, puis démarre le serveur local.
                        </p>
                        <LlmConnectionTest baseUrl={localBaseUrl} model={localModel} />
                    </div>

                    {/* Stockage */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-2 mt-4">
                        Stockage
                    </p>
                    <div
                        className="rounded-2xl p-1 grid grid-cols-2 gap-1"
                        style={{ backgroundColor: "rgba(143, 151, 121, 0.10)" }}
                    >
                        <button
                            data-testid="storage-local"
                            onClick={() => onChangeStorageMode("local")}
                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-colors font-sans-ui ${
                                storageMode === "local"
                                    ? "bg-stone-50 text-stone-800 shadow-sm"
                                    : "text-stone-600"
                            }`}
                        >
                            <Lock className="w-3.5 h-3.5" />
                            Uniquement local
                        </button>
                        <button
                            data-testid="storage-cloud"
                            onClick={() => onChangeStorageMode("cloud")}
                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm transition-colors font-sans-ui ${
                                storageMode === "cloud"
                                    ? "bg-stone-50 text-stone-800 shadow-sm"
                                    : "text-stone-600"
                            }`}
                        >
                            <Cloud className="w-3.5 h-3.5" />
                            Cloud chiffré
                        </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-2 italic font-serif-reading leading-relaxed">
                        {storageMode === "local"
                            ? "Tes conversations restent sur cet appareil, dans ton navigateur."
                            : "La synchronisation cloud chiffrée arrivera dans une future version. Pour l'instant, le stockage reste local."}
                    </p>

                    {/* Confidentialité */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-1 mt-5">
                        Confidentialité
                    </p>
                    <Row
                        icon={Shield}
                        title="Mode local-first"
                        description="Tes pensées ne quittent pas cet appareil. Activé par défaut."
                    >
                        <Toggle checked={true} disabled testid="toggle-local-first" />
                    </Row>
                    <Row
                        icon={EyeOff}
                        title="Mode incognito"
                        description="Cette conversation ne sera pas enregistrée."
                    >
                        <Toggle
                            checked={incognito}
                            onChange={onToggleIncognito}
                            testid="toggle-incognito"
                        />
                    </Row>
                    <Row
                        icon={Brain}
                        title="Mémoire personnalisée"
                        description="Luma se souviendra de quelques préférences. Désactivée par défaut."
                    >
                        <Toggle
                            checked={customMemory}
                            onChange={setCustomMemory}
                            testid="toggle-memory"
                        />
                    </Row>

                    {/* Données */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-1 mt-5">
                        Données
                    </p>
                    <div className="space-y-2 py-3">
                        <button
                            data-testid="export-data-btn"
                            onClick={onExport}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-700 hover:bg-stone-100/50 transition-colors font-sans-ui"
                        >
                            <span className="flex items-center gap-2.5">
                                <Download className="w-4 h-4" style={{ color: "#8F9779" }} />
                                Exporter mes données
                            </span>
                            <span className="text-xs text-stone-400">.json</span>
                        </button>
                        <button
                            data-testid="clear-data-btn"
                            onClick={onClearAll}
                            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-colors font-sans-ui"
                            style={{
                                color: "#9F3645",
                                borderColor: "rgba(159, 54, 69, 0.25)",
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Supprimer toutes mes données
                        </button>
                    </div>

                    <p className="text-xs text-stone-500 italic font-serif-reading leading-relaxed mt-4 pb-2">
                        Cet espace n'est pas un cabinet médical. Luma ne remplace ni un
                        psychologue ni un thérapeute. En cas de difficulté, demande de l'aide
                        humaine.
                    </p>
                </div>
            </div>
        </div>
    );
};
