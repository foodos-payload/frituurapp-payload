"use client"

import React, { useEffect, useState } from "react"
import { LanguageSwitcher } from "../../../components/LanguageSwitcher/LanguageSwitcher"
import { useTranslation } from "@/context/TranslationsContext"
interface TopBarProps {
    currentView: "active" | "archived"
    setCurrentView: (v: "active" | "archived") => void

    // For display
    activeCount: number
    archivedCount: number
}

export function TopBar({
    currentView,
    setCurrentView,
    activeCount,
    archivedCount,
}: TopBarProps) {
    const { t } = useTranslation()
    const [timeString, setTimeString] = useState<string>(() => {
        // Initialize with current local time
        return new Date().toLocaleTimeString()
    })

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeString(new Date().toLocaleTimeString())
        }, 1000)

        // Cleanup the interval on unmount
        return () => clearInterval(timer)
    }, [])

    // State to toggle LanguageSwitcher
    const [showLangSwitcher, setShowLangSwitcher] = useState(false)

    function toggleLangSwitcher() {
        setShowLangSwitcher((prev) => !prev)
    }

    return (
        <div className="top-bar flex items-center justify-between mb-6">
            {/* Left side: show local time */}
            <div className="flex items-center gap-3">
                <div className="time-box w-16 h-10 flex items-center justify-center rounded bg-gray-200 text-black font-bold text-sm">
                    {timeString}
                </div>
            </div>

            {/* Right side: order-status buttons + Language Switcher button */}
            <div className="flex items-center gap-4 relative">
                {/* The order-status buttons */}
                <button
                    onClick={() => setCurrentView("active")}
                    className={`status-item flex items-center gap-2 ${currentView === "active" ? "font-bold" : ""
                        }`}
                >
                    <span>{t("kitchen.topBar.active_orders")}</span>
                    <div className="count-box yellow w-12 h-8 rounded flex items-center justify-center text-black font-semibold">
                        {activeCount}
                    </div>
                </button>

                <button
                    onClick={() => setCurrentView("archived")}
                    className={`status-item flex items-center gap-2 ${currentView === "archived" ? "font-bold" : ""
                        }`}
                >
                    <span>{t("kitchen.topBar.archived_orders")}</span>
                    <div className="count-box green w-12 h-8 rounded flex items-center justify-center text-black font-semibold">
                        {archivedCount}
                    </div>
                </button>

                {/* Toggle button for Lang Switcher */}
                <button
                    onClick={toggleLangSwitcher}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
                >
                    Lang
                </button>

                {showLangSwitcher && (
                    <div className="absolute top-10 right-0">
                        <LanguageSwitcher />
                    </div>
                )}
            </div>
        </div>
    )
}
