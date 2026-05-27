import { LifeBuoy, Phone, BookOpen, UserRound, X } from "lucide-react";
import { CRISIS_MESSAGE } from "../lib/responses";

export const EmergencySupportCard = ({
    text,
    onOpenEmergency,
    onClose,
    inline = false,
}) => {
    const content = (
        <div
            data-testid="emergency-card"
            className="rounded-2xl border p-5 md:p-6"
            style={{
                backgroundColor: "#FBF1F1",
                borderColor: "rgba(159, 54, 69, 0.18)",
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(159, 54, 69, 0.12)" }}
                >
                    <LifeBuoy className="w-4 h-4" style={{ color: "#9F3645" }} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium font-sans-ui" style={{ color: "#9F3645" }}>
                        Tu n'es pas seul·e
                    </p>
                    <p className="mt-2 font-serif-reading text-[15px] leading-relaxed text-stone-800">
                        {text || CRISIS_MESSAGE}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <a
                            href="tel:3114"
                            data-testid="call-help-btn"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-90 font-sans-ui"
                            style={{ backgroundColor: "#9F3645", color: "#FBF1F1" }}
                        >
                            <Phone className="w-3.5 h-3.5" />
                            Appeler le 3114
                        </a>
                        <button
                            data-testid="show-resources-btn"
                            onClick={onOpenEmergency}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm transition-colors hover:bg-rose-100/60 font-sans-ui"
                            style={{ color: "#9F3645", border: "1px solid rgba(159, 54, 69, 0.25)" }}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Voir les ressources
                        </button>
                        <button
                            data-testid="notify-trusted-btn"
                            onClick={onOpenEmergency}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm transition-colors hover:bg-rose-100/60 font-sans-ui"
                            style={{ color: "#9F3645", border: "1px solid rgba(159, 54, 69, 0.25)" }}
                        >
                            <UserRound className="w-3.5 h-3.5" />
                            Prévenir une personne de confiance
                        </button>
                    </div>

                    {!inline && (
                        <div className="mt-5 pt-4 border-t border-rose-200/60 space-y-2">
                            <p className="text-xs uppercase tracking-wider text-stone-500 font-sans-ui">
                                Ressources
                            </p>
                            <ul className="text-sm text-stone-700 space-y-1.5 font-sans-ui">
                                <li>
                                    <span className="font-medium">3114</span> — Numéro national
                                    de prévention du suicide (France, 24h/24, gratuit).
                                </li>
                                <li>
                                    <span className="font-medium">15 / 112</span> — Urgences
                                    médicales.
                                </li>
                                <li>
                                    <span className="font-medium">SOS Amitié</span> — 09 72 39 40
                                    50, 24h/24.
                                </li>
                                <li>
                                    <span className="font-medium">Fil Santé Jeunes</span> — 0 800
                                    235 236 (gratuit, anonyme).
                                </li>
                            </ul>
                            <p className="text-xs text-stone-500 italic mt-3 font-serif-reading">
                                Cet espace ne remplace pas un professionnel de santé. Si tu te
                                sens en danger, appelle de l'aide humaine maintenant.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (inline) return content;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-stone-900/30 backdrop-blur-sm animate-soft-in"
            onClick={onClose}
            data-testid="emergency-modal"
        >
            <div
                className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto scroll-soft"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    data-testid="emergency-close"
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-rose-100/60 z-10"
                    style={{ color: "#9F3645" }}
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4" />
                </button>
                {content}
            </div>
        </div>
    );
};
