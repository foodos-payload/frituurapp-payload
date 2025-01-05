// File: /components/kitchen/OrderCard/ArrowsRow.tsx
"use client"

import React from "react"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"
import { OrderStatus } from "./index"
import { getNextStatus, getPrevStatus } from "./utils"

interface ArrowsRowProps {
    currentStatus: OrderStatus
    method: string | undefined
    statusColorClass: string
    statusLabel: string
    disabled?: boolean // if we want to disable arrows while loading
    onDowngrade: () => void
    onUpgrade: () => void
}

export function ArrowsRow({
    currentStatus,
    method,
    statusColorClass,
    statusLabel,
    disabled,
    onDowngrade,
    onUpgrade,
}: ArrowsRowProps) {
    const canDowngrade = !!getPrevStatus(currentStatus, method)
    const canUpgrade = !!getNextStatus(currentStatus, method)

    return (
        <div className={`flex items-center justify-between px-3 py-2 ${statusColorClass}`
        }>
            {/* Left arrow */}
            < button
                onClick={onDowngrade}
                disabled={disabled || !canDowngrade}
                className="text-current disabled:text-gray-300"
            >
                <FaArrowLeft size={18} />
            </button>

            < div className="flex items-center gap-2" >
                <div className="w-2 h-2 rounded-full bg-current" />
                <span className="text-sm font-semibold" > {statusLabel} </span>
            </div>

            {/* Right arrow */}
            <button
                onClick={onUpgrade}
                disabled={disabled || !canUpgrade}
                className="text-current disabled:text-gray-300"
            >
                <FaArrowRight size={18} />
            </button>
        </div>
    )
}
