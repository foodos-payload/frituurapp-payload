// File: /app/(app)/bestellen/components/BestellenLayout.tsx
'use client'

import React, { useState } from 'react'
import ProductList from './ProductList'
import Header from './Header'

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

    // 1) Filter products in each category by matching name in selected language
    const filteredCategories = categorizedProducts.map((cat) => {
        // For each product, check if its name includes searchTerm
        const filteredProds = cat.products.filter((prod) => {
            const name = pickProductName(prod, userLang).toLowerCase()
            return name.includes(searchTerm.toLowerCase())
        })
        // Return a new category object with only filtered products
        return {
            ...cat,
            products: filteredProds,
        }
    })

    // 2) Optionally hide categories that have zero products
    //    We do that here just to reduce confusion in the child.
    const visibleCategories = filteredCategories.filter(
        (cat) => cat.products.length > 0
    )

    return (
        <div className="p-5">
            {/* Header with language switcher, search, etc. */}
            <Header
                userLang={userLang || 'nl'}
                searchValue={searchTerm}
                onSearchChange={(val) => setSearchTerm(val)}
                onClearFilter={() => setSearchTerm('')}
            />

            <h1 className="text-xl font-bold mb-2">Bestellen Layout</h1>
            <p>
                Shop Slug: <strong>{shopSlug}</strong>
            </p>
            <p>Detected Language: {userLang}</p>

            {/* 
        3) We pass BOTH:
           - The original unfiltered array (categorizedProducts) as `unfilteredCategories`
           - The filtered array (visibleCategories) as `filteredCategories`
      */}
            <ProductList
                unfilteredCategories={categorizedProducts}
                filteredCategories={visibleCategories}
                userLang={userLang}
                onCategoryClick={() => {
                    // When a category is clicked, we clear the search
                    setSearchTerm('')
                }}
            />

            {/* JSON button for debugging */}
            <div className="mt-4">
                <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => setShowJsonModal(true)}
                >
                    Show JSON
                </button>
            </div>

            {/* JSON Modal */}
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
        </div>
    )
}

/** Helper to pick product name in correct language. */
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
