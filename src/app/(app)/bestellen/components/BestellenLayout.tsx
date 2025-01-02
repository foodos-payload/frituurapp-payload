'use client'

import React, { useState } from 'react'
import ProductList from './ProductList'

// Example data shape
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
    // State to track whether the JSON modal is open
    const [showJsonModal, setShowJsonModal] = useState(false)

    return (
        <div className="p-5">
            <h1 className="text-xl font-bold mb-2">Bestellen Layout</h1>
            <p>
                Shop Slug: <strong>{shopSlug}</strong>
            </p>
            <p>Detected Language: {userLang}</p>

            {/* The product list / categories, same as before */}
            <ProductList
                categorizedProducts={categorizedProducts}
                userLang={userLang}
            />

            {/* Toggle button to open the modal */}
            <div className="mt-4">
                <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => setShowJsonModal(true)}
                >
                    Show JSON
                </button>
            </div>

            {/* Modal overlay & content */}
            {showJsonModal && (
                <div
                    className="
            fixed inset-0 z-50 
            flex items-center justify-center 
            bg-black bg-opacity-50
          "
                >
                    {/* Modal box */}
                    <div className="relative w-11/12 max-w-3xl bg-white rounded shadow-lg p-6">
                        {/* Close button (top-right) */}
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-black"
                            onClick={() => setShowJsonModal(false)}
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-bold mb-2">Raw JSON from API</h2>

                        {/* JSON content in a scrollable <pre> */}
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
