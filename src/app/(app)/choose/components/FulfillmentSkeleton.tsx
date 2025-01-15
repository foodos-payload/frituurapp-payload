"use client"

import React from "react"

interface FulfillmentSkeletonProps {
    // e.g. how many placeholders to show
    placeholderCount?: number
}

export const FulfillmentSkeleton: React.FC<FulfillmentSkeletonProps> = ({
    placeholderCount = 3,
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-screen-lg w-full text-center">
                <h1 className="text-3xl font-bold my-4">Loading modes...</h1>
                <div className="flex flex-wrap justify-center gap-4 mt-10">
                    {Array.from({ length: placeholderCount }).map((_, index) => (
                        <div
                            key={`skeleton-${index}`}
                            className="animate-pulse w-40 h-40 bg-gray-300 rounded-md"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
