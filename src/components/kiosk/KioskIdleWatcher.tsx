"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useShopBranding } from "@/context/ShopBrandingContext";
import { useTranslation } from "@/context/TranslationsContext";

export const KioskIdleWatcher: React.FC = () => {
    // 1) ALWAYS define hooks at top
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { kiosk_idle_screen_enabled } = useShopBranding();

    const isKioskMode = searchParams.get("kiosk") === "true";
    const isKioskIdleScreen = pathname === "/kiosk-idle";

    // 2) Dynamic interval => kiosk=60s, non-kiosk=600s
    const INACTIVITY_DELAY_SECONDS = isKioskMode ? 60 : 600;

    // Local state / refs for idle logic
    const [showIdleModal, setShowIdleModal] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // 3) Additional style classes for kiosk
    const kioskTitleClass = isKioskMode ? "text-3xl" : "text-xl";
    const kioskModalPadding = isKioskMode ? "p-8" : "p-6";
    const kioskButtonClass = isKioskMode
        ? "mt-4 px-6 py-3 text-xl bg-blue-600 text-white font-semibold rounded"
        : "mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded";

    // --- HELPER FUNCTIONS ---

    const clearTimers = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    const clearLocalStorage = useCallback(() => {
        const kioskNumber = localStorage.getItem("kioskNumber");
        localStorage.clear();
        if (kioskNumber) {
            // If you want to preserve kioskNumber for kiosk usage
            localStorage.setItem("kioskNumber", kioskNumber);
        }
    }, []);

    const resetIdleTimer = useCallback(() => {
        // If we’re on the kiosk idle screen, skip watchers
        if (isKioskIdleScreen) return;

        clearTimers();

        idleTimeoutRef.current = setTimeout(() => {
            setShowIdleModal(true);
            setCountdown(15);

            countdownRef.current = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }, INACTIVITY_DELAY_SECONDS * 1000);
    }, [isKioskIdleScreen, INACTIVITY_DELAY_SECONDS, clearTimers]);

    // --- useEffects ---

    useEffect(() => {
        // If on kiosk idle screen => skip watchers
        if (isKioskIdleScreen) return;

        const events = ["mousemove", "keydown", "click", "touchstart"];
        events.forEach((evt) =>
            window.addEventListener(evt, resetIdleTimer, { passive: true })
        );
        resetIdleTimer();

        return () => {
            clearTimers();
            events.forEach((evt) =>
                window.removeEventListener(evt, resetIdleTimer)
            );
        };
    }, [isKioskIdleScreen, resetIdleTimer, clearTimers]);

    // If countdown hits 0 => user is idle => redirect
    useEffect(() => {
        if (countdown <= 0 && showIdleModal) {
            clearTimers();
            setShowIdleModal(false);
            clearLocalStorage();

            if (isKioskMode) {
                if (kiosk_idle_screen_enabled) {
                    router.push("/kiosk-idle");
                } else {
                    router.push("/index?kiosk=true");
                }
            } else {
                router.push("/index");
            }
        }
    }, [
        countdown,
        showIdleModal,
        kiosk_idle_screen_enabled,
        router,
        clearTimers,
        clearLocalStorage,
        isKioskMode,
    ]);

    // If on kiosk idle screen => return null
    const skipIdleLogic = isKioskIdleScreen;
    if (skipIdleLogic) {
        return null;
    }

    // --- RENDER ---
    const handleConfirmStay = () => {
        setShowIdleModal(false);
        clearTimers();
        resetIdleTimer();
    };

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
              rounded-xl shadow-md max-w-sm 
              mx-auto text-center
            `}
                    >
                        <h2 className={`${kioskTitleClass} font-bold mb-4`}>
                            {t("idlePopUp.areYouStillThere")}
                        </h2>
                        <p>
                            {t("idlePopUp.youWillBeRedirectedInXSeconds", { countdown })}
                        </p>
                        <button className={kioskButtonClass} onClick={handleConfirmStay}>
                            {t("idlePopUp.yesImHere")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
