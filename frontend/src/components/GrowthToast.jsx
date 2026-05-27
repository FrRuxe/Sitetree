import { Leaf } from "lucide-react";

export const GrowthToast = ({ message }) => {
    if (!message) return null;
    return (
        <div
            data-testid="growth-toast"
            className="pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-growth"
        >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100/95 backdrop-blur border border-stone-200 shadow-sm">
                <Leaf className="w-4 h-4" style={{ color: "#8F9779" }} />
                <span className="text-sm text-stone-700 font-sans-ui">{message}</span>
            </div>
        </div>
    );
};
