// File: /src/app/(app)/digital-menu/components/DigitalMenuLayout.tsx
"use client"

import React from "react"
import {
    DigitalMenuRow,
    CategoryTitleRow,
    ProductRow,
} from "../helpers/buildPagesFromCategories"

interface Branding {
    headerBackgroundColor?: string
    siteTitle?: string
    primaryColorCTA?: string
    logo?: {
        url: string
    }
}

interface DigitalMenuLayoutProps {
    rows: DigitalMenuRow[]
    branding: Branding
}

export default function DigitalMenuLayout({
    rows,
    branding,
}: DigitalMenuLayoutProps) {
    return (
        <div
            className="w-full h-full flex flex-col p-2 gap-3"
            style={{ overflow: "hidden" }}
        >
            {rows.map((row, rowIndex) => {
                if (row.type === "category-title") {
                    const catRow = row as CategoryTitleRow

                    // Use branding.headerBackgroundColor or fallback color:
                    const categoryBgColor = branding.headerBackgroundColor || "#dadada"

                    return (
                        <div
                            key={`row-${rowIndex}`}
                            className="text-xl font-bold p-2 rounded"
                            style={{
                                backgroundColor: categoryBgColor,
                            }}
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

// A small sub-component to handle the "product-row" with X columns
function ProductRowComponent({ row }: { row: ProductRow }) {
    const products = row.products
    const numCols = products.length // typically 2, 3, or 4

    // We'll do a simple row with "numCols" columns in a grid
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
                        <span className="text-lg font-semibold">
                            {p.name_nl}
                        </span>
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
