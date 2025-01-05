// File: src/app/(app)/checkout/components/OrderSummary.tsx
"use client"

import React from "react"
import { FiTrash2 } from 'react-icons/fi'
import { CartItem } from "./CheckoutPage"

interface OrderSummaryProps {
    cartItems: CartItem[]
    cartTotal: number
    couponCode: string
    setCouponCode: (value: string) => void

    handleIncrease: (productId: string) => void
    handleDecrease: (productId: string) => void
    handleRemoveItem: (productId: string) => void

    handleScanQR: () => void
    handleApplyCoupon: () => void

    canProceed: () => boolean
    handleCheckout: () => void
}

export default function OrderSummary({
    cartItems,
    cartTotal,
    couponCode,
    setCouponCode,

    handleIncrease,
    handleDecrease,
    handleRemoveItem,

    handleScanQR,
    handleApplyCoupon,

    canProceed,
    handleCheckout,
}: OrderSummaryProps) {
    return (
        <div className="sticky top-4 space-y-6">
            {/* Title */}
            <div>
                <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
                <p className="text-gray-500 text-sm">Review your items and confirm below.</p>
            </div>

            {/* Main card container */}
            <div className="bg-white rounded-lg p-4 shadow-md space-y-4">
                {/* Cart Items */}
                {cartItems.length === 0 ? (
                    <p className="text-gray-500">No items in cart.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {cartItems.map((item, itemIndex) => {
                            // Display name fallback
                            const displayName = item.productName || "Untitled Product"

                            // Sum of subproduct prices
                            const subTotal = item.subproducts?.reduce((acc, sp) => acc + sp.price, 0) || 0

                            // Final line amount
                            const linePrice = (item.price + subTotal) * item.quantity

                            return (
                                <li
                                    key={`${item.productId}-${itemIndex}`}
                                    className="
                    w-full 
                    flex 
                    items-center 
                    rounded-lg 
                    border border-gray-200
                    p-3 
                    gap-3 
                    bg-white
                    hover:shadow-sm
                  "
                                >
                                    {/* LEFT: minus / quantity / plus */}
                                    <div className="flex flex-col justify-center items-center mr-2">
                                        <button
                                            onClick={() => handleDecrease(item.productId)}
                                            className="
                        w-8 h-8 
                        flex items-center justify-center 
                        text-base 
                        font-semibold
                        text-gray-600
                        hover:text-gray-900
                        border border-gray-300 
                        rounded-t 
                        bg-gray-50 
                        hover:bg-gray-100
                      "
                                        >
                                            –
                                        </button>
                                        <div
                                            className="
                        w-8 h-8 
                        flex items-center justify-center
                        font-bold
                        bg-blue-50 
                        text-blue-700
                        border-y border-gray-300
                      "
                                        >
                                            {item.quantity}
                                        </div>
                                        <button
                                            onClick={() => handleIncrease(item.productId)}
                                            className="
                        w-8 h-8 
                        flex items-center justify-center 
                        text-base
                        font-semibold 
                        text-gray-600
                        hover:text-gray-900
                        border border-gray-300 
                        rounded-b 
                        bg-gray-50 
                        hover:bg-gray-100
                      "
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* MIDDLE: product image */}
                                    {item.image?.url ? (
                                        <img
                                            src={item.image.url}
                                            alt={item.image.alt || displayName}
                                            className="w-16 h-16 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-md" />
                                    )}

                                    {/* RIGHT: name, subproducts, remove icon, line total */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        {/* Top row */}
                                        <div className="flex justify-between">
                                            <h3 className="font-semibold text-sm sm:text-base text-gray-800">
                                                {displayName}
                                            </h3>
                                            <button
                                                onClick={() => handleRemoveItem(item.productId)}
                                                title="Remove this item"
                                                className="
                          text-gray-400 
                          hover:text-red-500 
                          transition-colors
                        "
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Subproduct listing */}
                                        {item.subproducts && item.subproducts.length > 0 && (
                                            <ul className="mt-1 text-sm text-gray-600 pl-4 list-outside list-disc space-y-1">
                                                {item.subproducts.map((sp, subIndex) => (
                                                    <li key={`${sp.id}-${subIndex}`}>
                                                        ➔ {sp.name_nl}{" "}
                                                        <span className="text-gray-500">(+€{sp.price.toFixed(2)})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Price */}
                                        <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-800">
                                            €{linePrice.toFixed(2)}
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {/* Coupon + QR */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code?"
                        className="
              flex-1
              border border-gray-300 
              rounded-md 
              py-2 px-3 
              focus:outline-none 
              focus:border-blue-500
            "
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyCoupon}
                            className="
                bg-gray-200 hover:bg-gray-300 
                text-gray-700
                rounded-md 
                px-3 py-2 
                transition-colors
              "
                        >
                            Apply
                        </button>
                        <button
                            onClick={handleScanQR}
                            className="
                bg-gray-200 hover:bg-gray-300
                text-gray-700
                rounded-md 
                px-3 py-2
                transition-colors
              "
                        >
                            QR
                        </button>
                    </div>
                </div>

                {/* Grand total + Checkout */}
                <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-700 font-medium text-lg">Total</span>
                        <span className="text-gray-900 font-bold text-xl">
                            €{cartTotal.toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={!canProceed()}
                        className={`
              w-full 
              bg-blue-600 
              hover:bg-blue-700 
              text-white 
              font-medium 
              py-2 
              rounded-md 
              focus:outline-none 
              transition-colors
              ${!canProceed() ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""}
            `}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    )
}
