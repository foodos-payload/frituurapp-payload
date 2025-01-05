// File: /components/kitchen/OrderCard/FulfillmentTimesRow.tsx
"use client"

import React from "react"
import { FaMotorcycle, FaClock, FaShoppingBag, FaCheckCircle } from "react-icons/fa"

interface Props {
    redGlow: boolean
    leftGetReadyText: string
    orderNum: string
    isArchived: boolean
    archivedIcon?: React.ReactNode
}

export function FulfillmentTimesRow({
    redGlow,
    leftGetReadyText,
    orderNum,
    isArchived,
    archivedIcon,
}: Props) {
    return (
        <div
            className={`px-3 py-2 ${redGlow ? "bg-red-200 animate-pulse" : "bg-gray-50"
                } flex items-center justify-between text-xs text-gray-700`}
        >
            <div className="flex items-center gap-2">
                {/* optionally parse the text to see if it includes "delivery" or not? 
            or we rely on parent to pass e.g. "GET READY BY: 12:05"
        */}
                <FaClock className="text-sm" />
                <span>{leftGetReadyText}</span>
            </div>

            <div className="flex items-center gap-1 font-medium">
                <span># {orderNum}</span>
                {isArchived && archivedIcon}
            </div>
        </div>
    )
}
