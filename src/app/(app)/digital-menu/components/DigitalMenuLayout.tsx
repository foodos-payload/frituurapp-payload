// File: /src/app/(app)/digital-menu/components/DigitalMenuLayout.tsx
"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import {
    DigitalMenuRow,
    CategoryTitleRow,
    ProductRow,
} from "../helpers/buildPagesFromCategories"

interface Branding {
    headerBackgroundColor?: string
    siteTitle?: string
    primaryColorCTA?: string
}

interface DigitalMenuLayoutProps {
    rows: DigitalMenuRow[]
    branding: Branding
}

export default function DigitalMenuLayout({
    rows,
    branding,
}: DigitalMenuLayoutProps) {
    // If you need to read searchParams:
    const searchParams = useSearchParams()
    const kiosk = searchParams.get("kiosk") === "true"

    return (
        <div
            className="w-full h-full flex flex-col p-2 gap-3"
            style={{ overflow: "hidden" }}
        >
            {/* Possibly show something if kiosk mode */}
            {kiosk && (
                <div className="bg-yellow-100 text-yellow-800 p-2 text-center">
                    Kiosk Mode Activated
                </div>
            )}

            {rows.map((row, rowIndex) => {
                if (row.type === "category-title") {
                    const catRow = row as CategoryTitleRow
                    const categoryBgColor = branding.headerBackgroundColor || "#dadada"

                    return (
                        <div
                            key={`row-${rowIndex}`}
                            className="text-xl font-bold p-2 rounded"
                            style={{ backgroundColor: categoryBgColor }}
                        >
                            {catRow.categoryName}
                        </div>
                    )
                } else if (row.type === "product-row") {
                    const prodRow = row as ProductRow
                    return (
                        <ProductRowComponent
                            key={`row-${rowIndex}`}
                            row={prodRow}
                        />
                    )
                }
                return null
            })}
        </div>
    )
}

function ProductRowComponent({ row }: { row: ProductRow }) {
    const products = row.products
    const numCols = products.length

    let gridColsClass = "grid-cols-2"
    if (numCols === 3) gridColsClass = "grid-cols-3"
    if (numCols === 4) gridColsClass = "grid-cols-4"

    return (
        <div className={`grid ${gridColsClass} gap-2`}>
            {products.map((p) => {
                const isPromo = p.old_price && p.old_price > p.price
                return (
                    <div
                        key={p.id}
                        className="border p-2 rounded flex items-center justify-between"
                    >
                        <span className="text-lg font-semibold">{p.name_nl}</span>
                        <span className="ml-2 text-lg">
                            {isPromo && (
                                <span className="line-through text-gray-500 mr-2">
                                    €{p.old_price}
                                </span>
                            )}
                            €{p.price}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
