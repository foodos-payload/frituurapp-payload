// File: /src/app/(app)/digital-menu/components/DigitalMenuLayout.tsx
"use client"

import React, { useEffect, useState } from "react"

// Example shape from your new /api/getProducts endpoint
interface Category {
    id: string
    slug: string
    name_nl: string
    products: {
        id: string
        name_nl: string
        price: number
        old_price?: number
        isPromotion?: boolean
        // etc...
    }[]
    // ...
}

interface DigitalMenuLayoutProps {
    categories: Category[]
    hostSlug: string
}

export default function DigitalMenuLayout({ categories, hostSlug }: DigitalMenuLayoutProps) {
    const [excludedSlugs] = useState<string[]>(["uncategorized", "some-other-slug"])

    // Optional: split categories
    const filteredCategories = categories.filter((cat) => !excludedSlugs.includes(cat.slug))

    // Example: if you want some categories to be 4 columns, 3 columns, etc.
    const fourColSlugs = ["drinks", "wine"]
    const threeColSlugs = ["sauces"]

    // Helper to chunk an array into columns
    function splitIntoColumns<T>(list: T[], numCols: number) {
        const perCol = Math.ceil(list.length / numCols)
        const columns: T[][] = []
        for (let i = 0; i < numCols; i++) {
            const start = i * perCol
            const end = start + perCol
            columns.push(list.slice(start, end))
        }
        // Pad columns to have the same length if you want
        const maxLen = Math.max(...columns.map((c) => c.length))
        columns.forEach((col) => {
            while (col.length < maxLen) {
                col.push(undefined as unknown as T) // push a placeholder
            }
        })
        return columns
    }

    // Example function to decide which layout is used
    function getNumColsForCategory(slug: string) {
        if (fourColSlugs.includes(slug)) return 4
        if (threeColSlugs.includes(slug)) return 3
        return 2
    }

    return (
        <div className="flex w-full overflow-hidden">
            {/* The "menu" area */}
            <div className="flex-1 p-4 overflow-hidden">
                {filteredCategories.map((cat) => {
                    const numCols = getNumColsForCategory(cat.slug)
                    const columns = splitIntoColumns(cat.products, numCols)

                    return (
                        <div key={cat.id} className="mb-6">
                            {/* Category Title */}
                            <h2 className="bg-gray-300 text-xl font-bold p-2 rounded">
                                {cat.name_nl || cat.slug}
                            </h2>

                            {/* Multi-column layout */}
                            <div
                                className={`grid gap-4 mt-2 ${numCols === 4
                                        ? "grid-cols-4"
                                        : numCols === 3
                                            ? "grid-cols-3"
                                            : "grid-cols-2"
                                    }`}
                            >
                                {columns.map((col, colIndex) => (
                                    <div key={colIndex} className="flex flex-col gap-2">
                                        {col.map((product, i) => {
                                            if (!product) {
                                                // Filler for alignment
                                                return <div key={`empty-${i}`} className="h-12 bg-transparent" />
                                            }

                                            // Price logic: old_price vs. new
                                            const isPromo = product.old_price && product.old_price > product.price

                                            return (
                                                <div
                                                    key={product.id}
                                                    className="border p-2 rounded flex items-center justify-between"
                                                >
                                                    {/* Left side: name */}
                                                    <span className="text-lg font-semibold">{product.name_nl}</span>

                                                    {/* Right side: price */}
                                                    <span className="ml-2 text-lg">
                                                        {isPromo && (
                                                            <span className="line-through text-gray-500 mr-2">
                                                                €{product.old_price}
                                                            </span>
                                                        )}
                                                        <span>€{product.price}</span>
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Example: an "ad panel" on the right, if you want (like your old showAdPanel) */}
            {/* 
      <div className="w-[38%] h-screen bg-white">
        <h3 className="bg-slate-200 p-2 text-center">Ad / Videos here</h3>
      </div>
      */}
        </div>
    )
}
