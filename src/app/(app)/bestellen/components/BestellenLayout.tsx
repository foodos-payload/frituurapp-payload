// File: /app/(app)/bestellen/components/BestellenLayout.tsx
'use client'

import React, { useState } from 'react'
import ProductList from './ProductList'
import Header from './Header'
import { CartProvider } from './cart/CartContext'
import CartButton from './cart/CartButton'
import CartDrawer from './cart/CartDrawer'

// Minimal shape for a product
type Product = {
    id: string
    name_nl: string
    name_en?: string
    name_de?: string
    name_fr?: string
    price: number | null
    image?: { url: string; alt: string }
    webdescription?: string
    isPromotion?: boolean
    // ...
}

// Minimal shape for a category
type Category = {
    id: string
    slug: string
    name_nl: string
    name_en?: string
    name_de?: string
    name_fr?: string
    products: Product[]
}

interface Props {
    shopSlug: string
    categorizedProducts: Category[]
    userLang?: string
}

export default function BestellenLayout({
    shopSlug,
    categorizedProducts,
    userLang,
}: Props) {
    const [showJsonModal, setShowJsonModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCartDrawer, setShowCartDrawer] = useState(false)

    // 1) Filter products by search term
    const filteredCategories = categorizedProducts.map(cat => {
        const filteredProds = cat.products.filter(prod => {
            const name = pickProductName(prod, userLang).toLowerCase()
            return name.includes(searchTerm.toLowerCase())
        })
        return {
            ...cat,
            products: filteredProds,
        }
    })

    // 2) Hide categories that have zero products
    const visibleCategories = filteredCategories.filter(
        cat => cat.products.length > 0
    )

    return (
        <CartProvider>
            {/* The CartDrawer with overlay (z-[9999]) */}
            <CartDrawer
                isOpen={showCartDrawer}
                onClose={() => setShowCartDrawer(false)}
            />

            {/* 
            Make a flex container that is h-screen (or min-h-screen) 
            with overflow-y-auto. That ensures iOS / mobile can handle sticky properly.
          */}
            <div className="relative flex flex-col h-screen overflow-y-auto pl-1">
                {/* Sticky header */}
                <div className="sticky top-0 z-50 bg-white">
                    <Header
                        userLang={userLang || 'nl'}
                        searchValue={searchTerm}
                        onSearchChange={val => setShowSearchTerm(val)}
                        onClearFilter={() => setShowSearchTerm('')}
                    />
                </div>

                {/* Product List */}
                <ProductList
                    unfilteredCategories={categorizedProducts}
                    filteredCategories={visibleCategories}
                    userLang={userLang}
                    onCategoryClick={() => setSearchTerm('')}
                />

                {/* Debugging button */}
                <div className="mt-4">
                    <button
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        onClick={() => setShowJsonModal(true)}
                    >
                        Show JSON
                    </button>
                </div>

                {showJsonModal && (
                    <div
                        className="
                  fixed inset-0 z-50 
                  flex items-center justify-center
                  bg-black bg-opacity-50
                "
                    >
                        <div className="relative w-11/12 max-w-3xl bg-white rounded shadow-lg p-6">
                            <button
                                className="absolute top-2 right-2 text-gray-600 hover:text-black"
                                onClick={() => setShowJsonModal(false)}
                            >
                                ✕
                            </button>
                            <h2 className="text-lg font-bold mb-2">Raw JSON from API</h2>
                            <div className="max-h-96 overflow-auto p-2 bg-gray-100 rounded text-sm">
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(categorizedProducts, null, 2)}
                                </pre>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => setShowJsonModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating cart button */}
                <CartButton onClick={() => setShowCartDrawer(true)} />
            </div>
        </CartProvider>
    )
}


/** Helper to pick product name in the correct language. */
function pickProductName(prod: Product, lang?: string): string {
    switch (lang) {
        case 'en':
            return prod.name_en || prod.name_nl
        case 'fr':
            return prod.name_fr || prod.name_nl
        case 'de':
            return prod.name_de || prod.name_nl
        default:
            return prod.name_nl
    }
}
