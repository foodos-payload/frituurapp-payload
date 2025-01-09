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

    // Local state / refs for the idle logic
    const [showIdleModal, setShowIdleModal] = useState(false)
    const [countdown, setCountdown] = useState(15)
    const INACTIVITY_DELAY_SECONDS = 60
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)

    // 2) Then define your helper functions
    const clearTimers = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
    }, [])

    const clearLocalStorage = useCallback(() => {
        localStorage.clear()
    }, [])

    const resetIdleTimer = useCallback(() => {
        // Only do something if we want the timer
        if (!isKioskMode || isKioskIdleScreen) return
        clearTimers()
        idleTimeoutRef.current = setTimeout(() => {
            setShowIdleModal(true)
            setCountdown(15)
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
        }, INACTIVITY_DELAY_SECONDS * 1000)
    }, [isKioskMode, isKioskIdleScreen, clearTimers])

    // 3) useEffects
    useEffect(() => {
        // If we’re skipping, do not start watchers
        if (!isKioskMode || isKioskIdleScreen) return

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
    }, [isKioskMode, isKioskIdleScreen, resetIdleTimer, clearTimers])

    useEffect(() => {
        if (countdown <= 0 && showIdleModal) {
            clearTimers()
            setShowIdleModal(false)
            clearLocalStorage()
            // Decide where to go
            if (kiosk_idle_screen_enabled) {
                router.push("/kiosk-idle")
            } else {
                router.push("/index?kiosk=true")
            }
        }
    }, [countdown, showIdleModal, kiosk_idle_screen_enabled, router, clearTimers, clearLocalStorage])

    // 4) If we want to skip the entire idle logic on /index?kiosk=true 
    //    when kiosk_idle_screen_enabled is true, or skip when kioskMode is false, etc.
    //    DO IT AFTER all hooks have been called:
    const skipIdleLogic =
        !isKioskMode ||
        isKioskIdleScreen ||
        (pathname === "/index" && kiosk_idle_screen_enabled === false)

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
                        <h2 className="text-xl font-bold mb-4">{t("idlePopUp.areYouStillThere")}</h2>
                        <p>{t("idlePopUp.youWillBeRedirectedInXSeconds", { countdown })}</p>
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
