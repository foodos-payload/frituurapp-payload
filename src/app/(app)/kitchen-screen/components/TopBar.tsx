// File: src/app/(app)/kitchen-screen/components/TopBar.tsx
"use client"

import React from "react"

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

    // This is a minimal approach to replicate the "red blinking" if new orders
    // or "counts" from the old code
    // Adjust as needed. For example, if activeCount increased => blink?

    return (
        <div className="top-bar flex items-center justify-between mb-6">
            {/* Left side: new order or waiting */}
            <div className="pending-orders flex items-center gap-3">
                <div className="count-box w-10 h-10 flex items-center justify-center rounded bg-gray-400 text-black font-bold">
                    ??
                </div>
                <div className="label font-bold text-lg">Waiting for orders</div>
            </div>

            {/* Right side: order-status buttons */}
            <div className="order-status flex gap-4">
                <button
                    onClick={() => setCurrentView("active")}
                    className={`status-item flex items-center gap-2 ${currentView === "active" ? "font-bold" : ""
                        }`}
                >
                    <span>Active Orders</span>
                    <div className="count-box yellow w-12 h-8 rounded flex items-center justify-center text-black font-semibold">
                        {activeCount}
                    </div>
                </button>

                <button
                    onClick={() => setCurrentView("archived")}
                    className={`status-item flex items-center gap-2 ${currentView === "archived" ? "font-bold" : ""
                        }`}
                >
                    <span>Archived Orders</span>
                    <div className="count-box green w-12 h-8 rounded flex items-center justify-center text-black font-semibold">
                        {archivedCount}
                    </div>
                </button>
            </div>
        </div>
    )
}
