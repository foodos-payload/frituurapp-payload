"use client";

import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
    useMemo,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/context/TranslationsContext";
import { useIdleWatcherContext } from "@/components/kiosk/IdleWatcherContext";

interface ShopBranding {
    kiosk_idle_screen_enabled?: boolean;
    primaryColorCTA?: string;
    // ... more fields ...
}

interface KioskIdleWatcherProps {
    branding: ShopBranding;
}

export const KioskIdleWatcher: React.FC<KioskIdleWatcherProps> = ({ branding }) => {
    // 1) Hooks at top — called unconditionally, in the same order
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { disableIdleWatcher } = useIdleWatcherContext();

    // Branding fields
    const { kiosk_idle_screen_enabled, primaryColorCTA } = branding;

    // Kiosk detection
    const isKioskMode = searchParams.get("kiosk") === "true";

    // Decide on inactivity delay
    const INACTIVITY_DELAY_SECONDS = isKioskMode ? 60 : 600;

    // Idle modal state
    const [showIdleModal, setShowIdleModal] = useState(false);
    const [countdown, setCountdown] = useState(15);

    // Timers
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Tailwind styling
    const kioskTitleClass = isKioskMode ? "text-3xl" : "text-xl";
    const kioskModalPadding = isKioskMode ? "p-8" : "p-6";
    const kioskButtonBase = "font-semibold rounded text-white";
    const kioskButtonSize = isKioskMode
        ? "mt-4 px-6 py-3 text-xl"
        : "mt-4 px-4 py-2";
    const kioskButtonStyle = {
        backgroundColor: primaryColorCTA || "#068b59",
    };

    /**
    * 2) Decide which routes to exclude from the idle watcher:
    *    Always exclude "/checkout" and "/kiosk-idle".
    *    If kiosk mode is on BUT kiosk_idle_screen_enabled is false,
    *    also exclude "/index".
    */
    const excludedPaths = useMemo(() => {
        const base = [
            "/checkout",
            "/kiosk-idle",
            "/kitchen-screen",
            "/digital-menu",
            "/order-summary",
            "/choose",
            "/"
        ];

        if (isKioskMode && kiosk_idle_screen_enabled === true) {
            base.splice(base.indexOf("/choose"), 1);
            console.log(
                "[KioskIdleWatcher] kiosk_idle_screen_enabled is true and isKioskMode => including /index"
            );
        }

        return base;
    }, [isKioskMode, kiosk_idle_screen_enabled]);
    const skipIdleLogic =
        disableIdleWatcher ||
        excludedPaths.some((excluded) => pathname?.startsWith(excluded));

    // 3) Clear timers on unmount
    const clearTimers = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    // 4) Possibly clear localStorage except kioskNumber
    const clearLocalStorage = useCallback(() => {
        const kioskNumber = localStorage.getItem("kioskNumber");
        localStorage.clear();
        if (kioskNumber) {
            localStorage.setItem("kioskNumber", kioskNumber);
        }
    }, []);

    // 5) The main “reset” function that starts (or restarts) the idle timer
    const resetIdleTimer = useCallback(() => {
        if (skipIdleLogic) {
            // If watchers are disabled or we are on excluded path => do nothing
            return;
        }

        clearTimers();

        // After X seconds => show modal
        idleTimeoutRef.current = setTimeout(() => {
            setShowIdleModal(true);
            setCountdown(15);

            countdownRef.current = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }, INACTIVITY_DELAY_SECONDS * 1000);
    }, [
        skipIdleLogic,
        clearTimers,
        INACTIVITY_DELAY_SECONDS,
    ]);

    // 6) *Always* call useEffect for attaching event listeners,
    // but if skipIdleLogic is true => do nothing in effect
    useEffect(() => {
        if (skipIdleLogic) {
            // If skipping => just clear timers & do nothing
            clearTimers();
            return;
        }

        // Otherwise attach watchers
        const events = ["mousemove", "keydown", "click", "touchstart"];
        events.forEach((evt) =>
            window.addEventListener(evt, resetIdleTimer, { passive: true })
        );
        // Immediately start idle timer
        resetIdleTimer();

        return () => {
            clearTimers();
            events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
        };
    }, [skipIdleLogic, resetIdleTimer, clearTimers]);

    // 7) The final effect that checks the countdown => idle => redirect
    useEffect(() => {
        if (skipIdleLogic) {
            // If skipping => do nothing
            return;
        }

        // If user sees the modal & countdown hits 0 => idle => redirect
        if (countdown <= 0 && showIdleModal) {
            clearTimers();
            setShowIdleModal(false);
            clearLocalStorage();

            if (isKioskMode) {
                if (kiosk_idle_screen_enabled) {
                    router.push("/kiosk-idle");
                } else {
                    router.push("/choose?kiosk=true");
                }
            } else {
                router.push("/choose");
            }
        }
    }, [
        skipIdleLogic,
        countdown,
        showIdleModal,
        kiosk_idle_screen_enabled,
        isKioskMode,
        clearTimers,
        clearLocalStorage,
        router,
    ]);

    // 8) The “Yes, I’m here” button
    const handleConfirmStay = useCallback(() => {
        setShowIdleModal(false);
        clearTimers();
        resetIdleTimer();
    }, [clearTimers, resetIdleTimer]);

    // 9) Render => if skip => just don’t show a modal
    //    but still call the same Hooks in the same order.
    if (skipIdleLogic) {
        // We can always return an empty fragment,
        // ensuring we have already called all Hooks (so no hook order mismatch).
        return <></>;
    }

    // 10) Otherwise => normal return
    return (
        <>
            {showIdleModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]"
                    style={{ backdropFilter: "blur(3px)" }}
                >
                    <div
                        className={`
              bg-white
              ${kioskModalPadding}
              rounded-xl shadow-md max-w-sm mx-auto text-center
            `}
                    >
                        <h2 className={`${kioskTitleClass} font-bold mb-4`}>
                            {t("idlePopUp.areYouStillThere")}
                        </h2>
                        <p>
                            {t("idlePopUp.youWillBeRedirectedInXSeconds", { countdown })}
                        </p>
                        <button
                            className={`${kioskButtonBase} ${kioskButtonSize}`}
                            style={kioskButtonStyle}
                            onClick={handleConfirmStay}
                        >
                            {t("idlePopUp.yesImHere")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
