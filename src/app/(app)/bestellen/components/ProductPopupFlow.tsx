// File: /app/(app)/bestellen/components/ProductPopupFlow.tsx
'use client'

import React, { useState } from 'react'

// Define the shape of a Subproduct, which may include a `linkedProduct`
type LinkedProductData = {
    id: string
    name_nl: string
    description_nl?: string
    priceUnified: boolean
    price: number | null
    image?: {
        url: string
        alt: string
    } | null
}

type Subproduct = {
    id: string
    name_nl: string
    price: number
    image?: {
        url: string
        alt: string
    } | null
    linkedProduct?: LinkedProductData  // <--- We'll check this
}

type PopupDoc = {
    id: string
    popup_title_nl: string
    multiselect: boolean
    minimum_option: number
    maximum_option: number
    subproducts: Subproduct[]
}

type PopupItem = {
    order: number
    popup: PopupDoc | null
}

// Minimal product shape for your main product
type Product = {
    id: string
    name_nl: string
    productpopups?: PopupItem[]
    // ...
}

interface Props {
    product: Product
    onClose: () => void
}

export default function ProductPopupFlow({ product, onClose }: Props) {
    // 1) Sort popups by `order`
    const sortedPopups = (product.productpopups || [])
        .filter((p) => p.popup !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

    if (sortedPopups.length === 0) {
        return null
    }

    // 2) Manage which popup is active
    const [currentIndex, setCurrentIndex] = useState(0)

    // 3) Track which subproduct IDs are selected per popup
    //    e.g. { 'popup-123': ['sub-1','sub-2'] }
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

    const currentPopupItem = sortedPopups[currentIndex]
    const popup = currentPopupItem.popup
    if (!popup) {
        return null // Shouldn’t happen
    }

    const { id: popupID, popup_title_nl, multiselect, subproducts } = popup
    const currentSelections = selectedOptions[popupID] || []

    // 4) On subproduct click, add or remove it from `selectedOptions[popupID]`
    function handleSubproductClick(sub: Subproduct) {
        const subID = sub.id
        setSelectedOptions((prev) => {
            const oldArray = prev[popupID] || []
            let newArray = []

            if (multiselect) {
                // Toggle
                if (oldArray.includes(subID)) {
                    newArray = oldArray.filter((id) => id !== subID)
                } else {
                    newArray = [...oldArray, subID]
                }
            } else {
                // Single select
                newArray = [subID]
            }

            return {
                ...prev,
                [popupID]: newArray,
            }
        })
    }

    function handleNext() {
        // If we’re at last popup, finish. Otherwise increment index
        if (currentIndex >= sortedPopups.length - 1) {
            handleFinish()
        } else {
            setCurrentIndex((prev) => prev + 1)
        }
    }

    function handleBack() {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1)
        }
    }

    function handleFinish() {
        // e.g. pass these selections up to a cart
        console.log('Final selectedOptions:', selectedOptions)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-md shadow-md max-w-md w-full p-4 relative">
                {/* Close Button */}
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                    onClick={onClose}
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold mb-2">{product.name_nl}</h2>
                <p className="mb-4 text-gray-600">
                    Popup {currentIndex + 1} of {sortedPopups.length}:{' '}
                    <strong>{popup_title_nl}</strong>
                </p>

                {/* 5) List of subproducts (overriding with linked product data if present) */}
                <div className="space-y-2">
                    {subproducts.map((sub) => {
                        // If linkedProduct is set, use that data instead
                        const useLinked = sub.linkedProduct !== undefined
                        const displayName = useLinked
                            ? sub.linkedProduct!.name_nl
                            : sub.name_nl
                        const displayPrice = useLinked
                            ? sub.linkedProduct!.price ?? 0
                            : sub.price
                        const displayImage = useLinked
                            ? sub.linkedProduct?.image
                            : sub.image

                        const isSelected = currentSelections.includes(sub.id)

                        return (
                            <div
                                key={sub.id}
                                onClick={() => handleSubproductClick(sub)}
                                className={`
                  border p-2 rounded cursor-pointer hover:bg-gray-100
                  flex items-center justify-between gap-2
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                `}
                            >
                                {/* Left side: optional image + name */}
                                <div className="flex items-center gap-2">
                                    {displayImage?.url && (
                                        <img
                                            src={displayImage.url}
                                            alt={displayImage.alt}
                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <span>{displayName}</span>
                                </div>

                                {/* Right side: price (or handle more advanced logic if needed) */}
                                <span className="text-sm text-gray-500">
                                    €{displayPrice.toFixed(2)}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Nav Buttons */}
                <div className="mt-4 flex justify-between">
                    <button
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        onClick={handleBack}
                        disabled={currentIndex === 0}
                    >
                        Back
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleNext}
                    >
                        {currentIndex < sortedPopups.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    )
}
