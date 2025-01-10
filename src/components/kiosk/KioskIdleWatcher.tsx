"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useShopBranding } from "@/context/ShopBrandingContext"
import { useTranslation } from "@/context/TranslationsContext"

export const KioskIdleWatcher: React.FC = () => {
    // 1) ALWAYS define all hooks at the top of your component
    const { t } = useTranslation()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { kiosk_idle_screen_enabled } = useShopBranding()

    const isKioskMode = searchParams.get("kiosk") === "true"
    const isKioskIdleScreen = pathname === "/kiosk-idle"

    // ---- NEW: Dynamically pick the idle interval ----
    // Let's say kiosk = 60s, non-kiosk = 600s (10 minutes).
    const INACTIVITY_DELAY_SECONDS = isKioskMode ? 60 : 600

    // Local state / refs for the idle logic
    const [showIdleModal, setShowIdleModal] = useState(false)
    const [countdown, setCountdown] = useState(15)
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)

    // 2) Then define your helper functions
    const clearTimers = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
    }, [])

    const clearLocalStorage = useCallback(() => {
        const kioskNumber = localStorage.getItem("kioskNumber")
        localStorage.clear()
        if (kioskNumber) {
            // If you want to preserve kioskNumber for kiosk usage
            localStorage.setItem("kioskNumber", kioskNumber)
        }
    }, [])

    const resetIdleTimer = useCallback(() => {
        // If we’re on the kiosk idle screen, or if we never want watchers,
        // skip. Otherwise, start the timer with the newly dynamic interval.
        if (isKioskIdleScreen) return

        clearTimers()
        idleTimeoutRef.current = setTimeout(() => {
            setShowIdleModal(true)
            setCountdown(15)
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
        }, INACTIVITY_DELAY_SECONDS * 1000)
    }, [isKioskIdleScreen, INACTIVITY_DELAY_SECONDS, clearTimers])

    // 3) useEffects
    useEffect(() => {
        // If we’re on the kiosk idle screen, don’t start watchers
        // (But we no longer skip if !isKioskMode, because we want the same logic on non-kiosk)
        if (isKioskIdleScreen) return

        const events = ["mousemove", "keydown", "click", "touchstart"]
        events.forEach((evt) =>
            window.addEventListener(evt, resetIdleTimer, { passive: true })
        )
        resetIdleTimer()

        return () => {
            clearTimers()
            events.forEach((evt) =>
                window.removeEventListener(evt, resetIdleTimer)
            )
        }
    }, [isKioskIdleScreen, resetIdleTimer, clearTimers])

    // Decide what to do after idle countdown hits 0
    useEffect(() => {
        if (countdown <= 0 && showIdleModal) {
            clearTimers()
            setShowIdleModal(false)
            clearLocalStorage()

            // If kiosk mode is on, decide between kiosk idle screen or kiosk homepage
            if (isKioskMode) {
                if (kiosk_idle_screen_enabled) {
                    router.push("/kiosk-idle")
                } else {
                    router.push("/index?kiosk=true")
                }
            } else {
                // For non-kiosk, navigate somewhere else, e.g. homepage
                router.push("/index")
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
    ])

    // 4) If you want to skip the entire idle logic under special conditions, do it AFTER hooking:
    //    For instance, if you never want watchers on the kiosk idle screen, or your page is something else:
    const skipIdleLogic = isKioskIdleScreen
    if (skipIdleLogic) {
        return null
    }

    // 5) Render your modal if triggered
    const handleConfirmStay = () => {
        setShowIdleModal(false)
        clearTimers()
        resetIdleTimer()
    }

    return (
        <>
            {showIdleModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]"
                    style={{ backdropFilter: "blur(3px)" }}
                >
                    <div className="bg-white p-6 rounded-xl shadow-md max-w-sm mx-auto text-center">
                        <h2 className="text-xl font-bold mb-4">
                            {t("idlePopUp.areYouStillThere")}
                        </h2>
                        <p>
                            {t("idlePopUp.youWillBeRedirectedInXSeconds", { countdown })}
                        </p>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded"
                            onClick={handleConfirmStay}
                        >
                            {t("idlePopUp.yesImHere")}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
