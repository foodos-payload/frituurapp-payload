// File: /src/app/(app)/order-summary/CountdownTimer.tsx
"use client"

import React from "react"

/**
 * Minimal countdown: no circle, just HH:MM:SS (or MM:SS if <1 hour).
 */
export function CountdownTimer({ targetDate }: { targetDate: Date }) {
    const [secondsLeft, setSecondsLeft] = React.useState(0)

    React.useEffect(() => {
        // 1) Calculate how many seconds from now until targetDate
        function updateCountdown() {
            const diff = (targetDate.getTime() - Date.now()) / 1000
            setSecondsLeft(diff > 0 ? diff : 0)
        }

        // 2) Run once, then every second
        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)

        return () => clearInterval(interval)
    }, [targetDate])

    // Helper: Format seconds as HH:MM:SS or MM:SS
    function formatTime(sec: number) {
        // If time is up (<= 0), return "Almost time!"
        if (sec <= 0) return "Almost time!"

        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = Math.floor(sec % 60)

        // If > 1 hour remaining, show "HH:MM:SS"
        if (h > 0) {
            return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        }

        // Otherwise, show "MM:SS"
        return `${m}:${String(s).padStart(2, "0")}`
    }

    return (
        <div className="my-4 text-center text-xl font-semibold">
            {formatTime(secondsLeft)}
        </div>
    )
}
