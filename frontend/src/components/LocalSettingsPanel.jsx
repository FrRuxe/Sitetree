import { useState } from "react";
import { X, Shield, EyeOff, Cpu, Brain, Download, Trash2, Cloud, Lock } from "lucide-react";

const Toggle = ({ checked, onChange, disabled, testid }) => (
    <button
        data-testid={testid}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
            backgroundColor: checked ? "#8F9779" : "#D6CFC2",
        }}
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

export const LocalSettingsPanel = ({
    onClose,
    incognito,
    onToggleIncognito,
    onExport,
    onClearAll,
    storageMode,
    onChangeStorageMode,
}) => {
    const [customMemory, setCustomMemory] = useState(false);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-end md:items-center md:justify-center p-0 md:p-8 bg-stone-900/30 backdrop-blur-sm animate-soft-in"
            onClick={onClose}
            data-testid="settings-modal"
        >
            <div
                className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto scroll-soft rounded-t-3xl md:rounded-3xl border border-stone-200 shadow-sm"
                style={{ backgroundColor: "#FAF9F6" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-stone-200/70" style={{ backgroundColor: "#FAF9F6" }}>
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
                    {/* Stockage */}
                    <div className="mb-4">
                        <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-2">
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
                    </div>

                    {/* Confidentialité */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-1 mt-4">
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

                    {/* IA locale */}
                    <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui mb-1 mt-5">
                        Intelligence
                    </p>
                    <Row
                        icon={Cpu}
                        title="Modèle IA local (Gemma)"
                        description="Dans une future version, Luma pourra fonctionner avec un modèle IA local sur ton appareil afin de protéger tes conversations. Simulation pour l'instant."
                    >
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-sans-ui px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(143, 151, 121, 0.12)" }}>
                            Bientôt
                        </span>
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
