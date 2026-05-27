// Animation d'une feuille qui vole depuis le champ de saisie jusqu'au bout
// de la branche concernée.
// On utilise un overlay positionné en absolute body et un transition CSS
// avec cubic-bezier doux. Aucune librairie externe.

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export const FlyingLeaf = ({ from, to, color = "#8F9779", onDone }) => {
    const [phase, setPhase] = useState("start");

    useEffect(() => {
        // Trigger transition just after first render
        const t1 = setTimeout(() => setPhase("end"), 30);
        const t2 = setTimeout(() => onDone?.(), 1500);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [onDone]);

    if (!from || !to) return null;

    const style =
        phase === "start"
            ? {
                  left: from.x,
                  top: from.y,
                  transform: "scale(0.4) rotate(-12deg)",
                  opacity: 0,
              }
            : {
                  left: to.x,
                  top: to.y,
                  transform: "scale(1) rotate(15deg)",
                  opacity: 1,
              };

    return createPortal(
        <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[60]"
            style={{
                ...style,
                transition:
                    "left 1.3s cubic-bezier(0.25, 0.8, 0.35, 1), top 1.3s cubic-bezier(0.25, 0.8, 0.35, 1), transform 1.3s cubic-bezier(0.25, 0.8, 0.35, 1), opacity 0.4s ease-out",
                willChange: "left, top, transform, opacity",
            }}
        >
            <svg width="22" height="22" viewBox="-12 -12 24 24">
                <ellipse cx="0" cy="0" rx="9" ry="4.5" fill={color} opacity="0.92" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#4A5240" strokeWidth="0.5" opacity="0.4" />
            </svg>
        </div>,
        document.body
    );
};

// Calcule la position absolue du bout d'une branche dans une SVG tree.
// Le SVG doit avoir l'attribut data-tree-svg="true".
export function getBranchTipPosition(branchIndex, branchCount, angleResolver) {
    const svg = document.querySelector('[data-tree-svg="true"]');
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    // Le SVG a viewBox 120x140
    const vbW = 120;
    const vbH = 140;
    const sx = rect.width / vbW;
    const sy = rect.height / vbH;

    // angle / longueur sont les mêmes que ceux utilisés dans InnerTreeSvg
    const angle = angleResolver(branchIndex, branchCount); // en degrés
    const rad = ((angle - 90) * Math.PI) / 180;
    // On prend une origine moyenne et longueur 30 (valeur médiane)
    const originX = 60;
    const originY = 70;
    const length = 32;
    const tipX = originX + Math.cos(rad) * length;
    const tipY = originY + Math.sin(rad) * length;

    return {
        x: rect.left + tipX * sx,
        y: rect.top + tipY * sy,
    };
}
