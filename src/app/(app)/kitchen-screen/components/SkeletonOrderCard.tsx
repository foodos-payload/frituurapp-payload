// File: src/app/(app)/kitchen-screen/components/SkeletonOrderCard.tsx
"use client"

import React from "react"

export function SkeletonOrderCard() {
    return (
        <div className="animate-pulse bg-[#f9f9f9] p-5 border rounded-md shadow-md flex flex-col gap-4">
            <div className="h-6 bg-gray-300 rounded w-1/3" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
            <div className="h-12 bg-gray-300 rounded w-full" />
        </div>
    )
}
