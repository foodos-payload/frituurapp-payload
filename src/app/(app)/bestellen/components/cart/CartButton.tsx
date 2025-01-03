// File: /app/(app)/bestellen/components/cart/CartButton.tsx
'use client'

import React from 'react'
import { FiShoppingCart } from 'react-icons/fi'
import { useCart } from './CartContext'

type Props = {
    onClick: () => void
}

export default function CartButton({ onClick }: Props) {
    const { items, getCartTotal } = useCart()

    // Sum total quantity
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    // Cart total for all items + subproducts
    const totalPrice = getCartTotal()

    return (
        <div className="flex justify-center items-center">
            <button
                onClick={onClick}
                className="fixed bottom-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full flex justify-center items-center gap-2"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
            >
                <FiShoppingCart size={18} />

                {/* Show the item count in a red badge */}
                {itemCount > 0 && (
                    <span className="bg-red-500 rounded-full px-2 py-0 text-xs">
                        {itemCount}
                    </span>
                )}

                {/* Show the total price in parentheses */}
                {itemCount > 0 && (
                    <span className="text-xs sm:text-sm">
                        (€{totalPrice.toFixed(2)})
                    </span>
                )}

                {/* 'AFREKENEN' text only on sm+ screens */}
                <span className="hidden sm:inline">AFREKENEN</span>
            </button>
        </div>
    )
}
