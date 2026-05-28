import { Leaf, Plus, LifeBuoy, Settings, X, Trees } from "lucide-react";
import { ModeSelector } from "./ModeSelector";
import { TreeWidget } from "./TreeWidget";

export const Sidebar = ({
    selectedMode,
    onSelectMode,
    onNewReflection,
    treeStats,
    onOpenEmergency,
    onOpenSettings,
    onOpenEvolution,
    onOpenCategoryEditor,
    isOpen,
    onClose,
}) => {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-30 md:hidden"
                    onClick={onClose}
                    data-testid="sidebar-backdrop"
                />
            )}

            <aside
                data-testid="sidebar"
                className={`fixed md:static z-40 top-0 left-0 h-full w-[300px] shrink-0 flex flex-col transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
                style={{ backgroundColor: "#F0EBE1" }}
            >
                <div className="px-5 pt-6 pb-4 flex items-start gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(143, 151, 121, 0.18)" }}
                    >
                        <Leaf className="w-4.5 h-4.5" style={{ color: "#8F9779" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-medium text-stone-800 font-serif-reading">
                            Jardin Intérieur
                        </h1>
                        <p className="text-xs text-stone-500 leading-snug font-sans-ui mt-0.5">
                            Un espace pour déposer tes pensées.
                        </p>
                    </div>
                    <button
                        className="md:hidden text-stone-500 hover:text-stone-800 p-1"
                        onClick={onClose}
                        data-testid="sidebar-close"
                        aria-label="Fermer le menu"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 pb-2">
                    <button
                        data-testid="new-reflection-btn"
                        onClick={onNewReflection}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-300/70 text-sm text-stone-700 hover:bg-stone-50/50 transition-colors font-sans-ui"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle réflexion
                    </button>
                </div>

                <div className="px-3 py-3">
                    <ModeSelector
                        selectedMode={selectedMode}
                        onSelect={onSelectMode}
                    />
                </div>

                <div className="px-4 pb-3">
                    <TreeWidget
                        stage={treeStats.stage}
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
                        onOpenEvolution={onOpenEvolution}
                    />
                </div>

                <div className="px-4 pb-2">
                    <button
                        data-testid="edit-categories-btn"
                        onClick={onOpenCategoryEditor}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-200/40 transition-colors font-sans-ui"
                    >
                        <Trees className="w-4 h-4" style={{ color: "#8F9779" }} />
                        Mes branches
                    </button>
                </div>

                <div className="mt-auto px-4 pb-5 pt-2 space-y-1.5 border-t border-stone-200/70">
                    <button
                        data-testid="open-emergency-btn"
                        onClick={onOpenEmergency}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors font-sans-ui"
                        style={{ color: "#9F3645" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(244, 200, 200, 0.25)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        <LifeBuoy className="w-4 h-4" />
                        Urgence & soutien
                    </button>
                    <button
                        data-testid="open-settings-btn"
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-200/40 transition-colors font-sans-ui"
                    >
                        <Settings className="w-4 h-4" />
                        Paramètres locaux
                    </button>
                </div>
            </aside>
        </>
    );
};
