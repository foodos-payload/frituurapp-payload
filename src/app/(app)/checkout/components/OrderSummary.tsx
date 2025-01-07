// File: src/app/(app)/checkout/components/OrderSummary.tsx
"use client";

import React from "react";
import { FiTrash2 } from "react-icons/fi";
import { useCart, getLineItemSignature } from "@/context/CartContext";

/**
 * If you want to match EXACTLY the CartDrawer style, remove or adjust
 * the coupon/QR portion or place it below. Currently, it remains integrated.
 */

interface OrderSummaryProps {
    couponCode: string;
    setCouponCode: (value: string) => void;
    handleScanQR: () => void;
    handleApplyCoupon: () => void;
    canProceed: () => boolean;
    handleCheckout: () => void;

    cartTotal: number;
    shippingCost: number;
    finalTotal: number;
    fulfillmentMethod: "delivery" | "takeaway" | "dine_in" | "";
}

export default function OrderSummary({
    couponCode,
    setCouponCode,
    handleScanQR,
    handleApplyCoupon,
    canProceed,
    handleCheckout,
    cartTotal,
    shippingCost,
    finalTotal,
    fulfillmentMethod,
}: OrderSummaryProps) {
    const { items: cartItems, updateItemQuantity, removeItem } = useCart();

    function handleIncrease(productId: string) {
        const item = cartItems.find((ci) => ci.productId === productId);
        if (!item) return;
        const sig = getLineItemSignature(item);
        updateItemQuantity(sig, item.quantity + 1);
    }

    function handleDecrease(productId: string) {
        const item = cartItems.find((ci) => ci.productId === productId);
        if (!item) return;
        if (item.quantity > 1) {
            const sig = getLineItemSignature(item);
            updateItemQuantity(sig, item.quantity - 1);
        }
    }

    function handleRemoveItem(productId: string) {
        const item = cartItems.find((ci) => ci.productId === productId);
        if (!item) return;
        const sig = getLineItemSignature(item);
        removeItem(sig);
    }

    // If you want to localize subproduct names (like in the CartDrawer),
    // define a helper like `pickCartSubName(...)`. For brevity, we show raw name_nl here.
    function getSubLine(subName: string, subPrice: number) {
        return `${subName} (+€${subPrice.toFixed(2)})`;
    }

    return (
        <div className="sticky top-4 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
                <p className="text-gray-500 text-sm">Review your items and confirm below.</p>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl p-4 shadow-md space-y-4">
                {/* Cart Items */}
                {cartItems.length === 0 ? (
                    <p className="text-gray-500">No items in cart.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {cartItems.map((item, idx) => {
                            const displayName = item.productName || "Untitled Product";
                            // Sum subproduct prices
                            const subTotal =
                                item.subproducts?.reduce((acc, sp) => acc + sp.price, 0) || 0;
                            const linePrice = (item.price + subTotal) * item.quantity;

                            return (
                                <li key={`${item.productId}-${idx}`}>
                                    <div
                                        className="
                      rounded-xl flex w-full overflow-hidden relative 
                      items-center bg-white shadow-sm
                      p-3
                    "
                                        style={{ minHeight: "80px" }}
                                    >
                                        {/* Thumbnail */}
                                        {item.image?.url ? (
                                            <img
                                                src={item.image.url}
                                                alt={item.image.alt || displayName}
                                                className="w-16 h-16 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                                        )}

                                        {/* Middle: product name + subproducts + line total */}
                                        <div className="flex-1 min-h-[60px] ml-3">
                                            {/* Title row (with remove button on top-right if you prefer) */}
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-sm sm:text-base text-gray-800 line-clamp-2 mr-2">
                                                    {displayName}
                                                </h3>
                                                <button
                                                    onClick={() => handleRemoveItem(item.productId)}
                                                    title="Remove"
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Subproducts */}
                                            {item.subproducts && item.subproducts.length > 0 && (
                                                <ul className="ml-3 text-sm text-gray-500 list-disc list-inside mt-1">
                                                    {item.subproducts.map((sp, sIdx) => (
                                                        <li key={`${sp.subproductId}-${sIdx}`}>
                                                            {getSubLine(sp.name_nl, sp.price)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Price */}
                                            <div className="text-sm mt-2 font-semibold text-gray-800">
                                                €{linePrice.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Quantity Controls (aligned on the right) */}
                                        <div className="inline-flex gap-1 flex-col items-end ml-3">
                                            <div className="flex rounded bg-white text-sm leading-none shadow-sm">
                                                <button
                                                    title="Decrease Quantity"
                                                    aria-label="Decrease Quantity"
                                                    type="button"
                                                    className="
                            focus:outline-none border-r border 
                            rounded-l border-gray-300 hover:bg-gray-50
                            w-8 h-8 flex items-center justify-center 
                          "
                                                    onClick={() => handleDecrease(item.productId)}
                                                >
                                                    -
                                                </button>

                                                <div
                                                    className="
                            flex items-center justify-center 
                            border-y border-gray-300 text-center px-2
                            w-8 text-sm
                          "
                                                >
                                                    {item.quantity}
                                                </div>

                                                <button
                                                    title="Increase Quantity"
                                                    aria-label="Increase Quantity"
                                                    type="button"
                                                    className="
                            focus:outline-none border-l border 
                            rounded-r hover:bg-gray-50 border-gray-300 p-2
                            w-8 h-8 flex items-center justify-center
                          "
                                                    onClick={() => handleIncrease(item.productId)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Coupon + QR Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code?"
                        className="
              flex-1 border border-gray-300 rounded-xl 
              py-2 px-3 focus:outline-none focus:border-blue-500
            "
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyCoupon}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-3 py-2 transition-colors"
                        >
                            Apply
                        </button>
                        <button
                            onClick={handleScanQR}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-3 py-2 transition-colors"
                        >
                            QR
                        </button>
                    </div>
                </div>

                {/* Totals + Checkout */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Subtotal</span>
                        <span className="text-gray-900 font-semibold">
                            €{cartTotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Show shipping if "delivery" */}
                    {fulfillmentMethod === "delivery" && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Shipping</span>
                            <span className="text-gray-900 font-semibold">
                                €{shippingCost.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Final total */}
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                        <span className="text-gray-900 font-bold">Total</span>
                        <span className="text-gray-900 font-bold text-xl">
                            €{finalTotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Checkout button */}
                    <button
                        onClick={handleCheckout}
                        disabled={!canProceed()}
                        className={`
              w-full mt-2
              bg-blue-600 
              hover:bg-blue-700 
              text-white 
              font-medium 
              py-2 
              rounded-xl 
              focus:outline-none 
              transition-colors
              ${!canProceed()
                                ? "opacity-50 cursor-not-allowed hover:bg-blue-600"
                                : ""
                            }
            `}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
