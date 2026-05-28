import { Leaf, Sprout, Flower2, Apple } from "lucide-react";
import { InnerTreeSvg } from "./InnerTreeSvg";

export const TreeWidget = ({
    stage,
    stageKey,
    progress,
    season,
    leaves,
    roots,
    flowers,
    fruits,
    messageCount,
    categories,
    seed,
    branchShrink,
    onOpenEvolution,
}) => {
    return (
        <button
            data-testid="tree-widget"
            onClick={onOpenEvolution}
            className="w-full text-left rounded-2xl p-4 transition-colors hover:bg-stone-200/50 group"
            style={{ backgroundColor: "rgba(143, 151, 121, 0.10)" }}
        >
            <div className="w-full h-44 mb-3 flex items-end justify-center">
                <InnerTreeSvg
                    stageKey={stageKey}
                    progress={progress}
                    season={season}
                    leaves={leaves}
                    roots={roots}
                    flowers={flowers}
                    fruits={fruits}
                    messageCount={messageCount}
                    categories={categories}
                    seed={seed}
                    branchShrink={branchShrink}
                    showLabels={false}
                    className="w-full h-full"
                />
            </div>

            <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-sans-ui">
                    Ton arbre intérieur
                </p>
                <p className="text-sm font-medium text-stone-800 mt-0.5 font-sans-ui">
                    {stage}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 font-sans-ui">{season}</p>

                <div className="mt-2 h-1 w-full rounded-full bg-stone-200/70 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: "#8F9779",
                        }}
                    />
                </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1">
                <Stat icon={Leaf} value={leaves} label="feuilles" testid="stat-leaves" />
                <Stat icon={Sprout} value={roots} label="racines" testid="stat-roots" />
                <Stat icon={Flower2} value={flowers} label="fleurs" testid="stat-flowers" />
                <Stat icon={Apple} value={fruits} label="fruits" testid="stat-fruits" />
            </div>

            <p className="mt-3 text-xs text-stone-500 italic font-serif-reading leading-relaxed text-center">
                Ton arbre grandit à ton rythme.
            </p>
        </button>
    );
};

const Stat = ({ icon: Icon, value, label, testid }) => (
    <div className="flex flex-col items-center gap-0.5" data-testid={testid}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#8F9779" }} />
        <span className="text-xs font-medium text-stone-700 font-sans-ui">{value}</span>
        <span className="text-[10px] text-stone-500 font-sans-ui">{label}</span>
    </div>
);
