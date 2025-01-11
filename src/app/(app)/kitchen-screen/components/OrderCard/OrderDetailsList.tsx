// File: /components/kitchen/OrderCard/OrderDetailsList.tsx
"use client"

import React from "react"
import { useTranslation } from "@/context/TranslationsContext"

// 1) We'll define an interface for subproducts that includes multiple language fields
interface SubproductEntry {
    id: string
    subproductId: string
    name_nl?: string
    name_en?: string
    name_de?: string
    name_fr?: string
    price?: number
    tax?: number
    tax_dinein?: number
    quantity?: number // NEW: subproduct quantity
}

interface MetaData {
    id: number
    key?: string
    display_key: string
    display_value: string
}

interface OrderDetail {
    id: string
    quantity: number
    price?: number
    product?: {
        name_nl?: string
        name_en?: string
        name_de?: string
        name_fr?: string
        // ...
    }
    meta_data?: MetaData[]
    image?: {
        src: string
    }
    subproducts?: SubproductEntry[]
}

interface Props {
    details: OrderDetail[]
    isArchived: boolean
    checkedItems: Set<string>
    toggleItemCheck: (id: string) => void
}

/** 
 * Helper to pick the correct name from a product or subproduct
 * based on the current locale from useTranslation().
 */
function pickName(
    name_nl?: string,
    name_en?: string,
    name_de?: string,
    name_fr?: string,
    locale?: string,
): string {
    switch (locale) {
        case "en":
            return name_en || name_nl || "Untitled"
        case "de":
            return name_de || name_nl || "Untitled"
        case "fr":
            return name_fr || name_nl || "Untitled"
        default:
            return name_nl || "Untitled"
    }
}

export function OrderDetailsList({
    details,
    isArchived,
    checkedItems,
    toggleItemCheck,
}: Props) {
    const { locale } = useTranslation()

    return (
        <div className="flex-1 flex flex-col p-3 gap-3 text-sm text-gray-800 overflow-y-auto">
            {details.map((detail) => {
                const isChecked = checkedItems.has(detail.id)

                // Pick the main product name
                const productName = pickName(
                    detail.product?.name_nl,
                    detail.product?.name_en,
                    detail.product?.name_de,
                    detail.product?.name_fr,
                    locale,
                )

                return (
                    <div
                        key={detail.id}
                        onClick={() => !isArchived && toggleItemCheck(detail.id)}
                        className={`
                            border-b border-gray-300 last:border-none pb-2 cursor-pointer
                            ${isChecked ? "bg-blue-50" : "bg-white"}
                        `}
                    >
                        <div className="flex items-start justify-between gap-3">
                            {/* Checkbox if not archived */}
                            {!isArchived && (
                                <div
                                    className={`
                                        w-4 h-4 mt-[3px] flex-shrink-0 border-2 border-gray-600 rounded-full flex items-center justify-center
                                        ${isChecked ? "bg-blue-600 border-blue-600" : ""}
                                    `}
                                >
                                    {isChecked && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            )}

                            {/* Product + subproducts */}
                            <div className="flex-1">
                                <div className="font-semibold">
                                    {detail.quantity} {productName}
                                </div>

                                {/* Potential metadata */}
                                {detail.meta_data && detail.meta_data.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {detail.meta_data.map((m) => {
                                            if (m.key?.startsWith("_pao")) return null
                                            return (
                                                <div key={m.id}>
                                                    <strong>• {m.display_key}:</strong> {m.display_value}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Subproducts => show quantity if > 1 */}
                                {detail.subproducts && detail.subproducts.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-500">
                                        {detail.subproducts.map((sub) => {
                                            const subName = pickName(
                                                sub.name_nl,
                                                sub.name_en,
                                                sub.name_de,
                                                sub.name_fr,
                                                locale,
                                            )
                                            const subQty = sub.quantity && sub.quantity > 1
                                                ? ` x${sub.quantity}`
                                                : ""
                                            return (
                                                <div key={sub.id}>
                                                    - {subQty} {subName}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Optional item image */}
                            {detail.image?.src && (
                                <img
                                    src={detail.image.src}
                                    alt="Product"
                                    className="w-12 h-12 object-cover rounded-md"
                                />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
