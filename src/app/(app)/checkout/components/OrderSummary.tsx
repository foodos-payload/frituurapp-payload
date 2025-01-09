// File: src/app/(app)/checkout/components/OrderSummary.tsx
"use client";

import React from "react";
import { FiTrash2 } from "react-icons/fi";
import { useCart, getLineItemSignature } from "@/context/CartContext";
import PromoButton from "../../shared/PromoButton";

type Branding = {
    /** e.g. "#ECAA02" or some other brand color */
    primaryColorCTA?: string;
    // ...
};

interface OrderSummaryProps {
    couponCode: string;
    setCouponCode: (value: string) => void;
    handleScanQR: () => void;
    handleApplyCoupon: () => void;
    canProceed: () => boolean;
    handleCheckout: () => void;

    cartTotal: number;
    discountedSubtotal: number;
    rawSubtotal: number;
    shippingCost: number;
    finalTotal: number;
    fulfillmentMethod: "delivery" | "takeaway" | "dine_in" | "";

    branding: Branding; // <-- We read brand color from here

}

export default function OrderSummary({
    canProceed,
    handleCheckout,
    shippingCost,
    finalTotal,
    fulfillmentMethod,
    discountedSubtotal,
    rawSubtotal,
    branding,
}: OrderSummaryProps) {
    const {
        items: cartItems,
        updateItemQuantity,
        removeItem,
    } = useCart();

    const discount = rawSubtotal - discountedSubtotal;
    const hasDiscount = discount > 0;

    // 1) Fallback to green if no brand color is defined
    const brandColor = branding.primaryColorCTA || "#22c55e";

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

    // For subproduct lines
    function getSubLine(subName: string, subPrice: number) {
        return `${subName} (+€${subPrice.toFixed(2)})`;
    }

    return (
        <div className="sticky top-4 space-y-6 rounded-xl shadow-md">
            {/* Main Card */}
            <div className="bg-white p-4 space-y-1">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
                    <p className="text-gray-500 text-sm">
                        Review your items and confirm below.
                    </p>
                </div>

                {/* Cart Items */}
                {cartItems.length === 0 ? (
                    <p className="text-gray-500">No items in cart.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {cartItems.map((item, idx) => {
                            const displayName = item.productName || "Untitled Product";
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
                                        {/* Thumbnail (hidden on mobile by default) */}
                                        {item.image?.url ? (
                                            <img
                                                src={item.image.url}
                                                alt={item.image.alt || displayName}
                                                className="hidden sm:block w-16 h-16 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="hidden sm:block w-16 h-16 bg-gray-100 rounded-xl" />
                                        )}

                                        {/* Middle: product name + subproducts + line total */}
                                        <div className="flex-1 min-h-[60px] ml-3">
                                            <h3 className="font-semibold text-sm sm:text-base text-gray-800 line-clamp-2 mr-2">
                                                {displayName}
                                            </h3>

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

                                        {/* Quantity + Remove */}
                                        <div className="inline-flex flex-col items-center justify-center ml-3 gap-2">
                                            {/* Quantity Controls */}
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
                            rounded-r hover:bg-gray-50 border-gray-300
                            w-8 h-8 flex items-center justify-center
                          "
                                                    onClick={() => handleIncrease(item.productId)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Trash Icon */}
                                            <button
                                                onClick={() => handleRemoveItem(item.productId)}
                                                title="Remove"
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* 
          Instead of a simple text input for 'couponCode', 
          we add a button that opens PromoCodeModal. 
        */}
                <PromoButton label="Apply Promo or Scan QR" buttonClass="bg-blue-100 ..." />


                {/* Totals + Checkout */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                    {/* If there is a discount => show both lines; else show a single "Subtotal" */}
                    {hasDiscount ? (
                        <>
                            {/* Original (raw) Subtotal */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Subtotal</span>
                                <span className="text-gray-900 font-semibold">
                                    €{rawSubtotal.toFixed(2)}
                                </span>
                            </div>

                            {/* Discount line */}
                            <div className="flex justify-between items-center text-green-600">
                                <span className="font-medium">Discount</span>
                                <span className="font-semibold">–€{discount.toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        // If no discount, show "Subtotal" as the discountedSubtotal
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Subtotal</span>
                            <span className="text-gray-900 font-semibold">
                                €{discountedSubtotal.toFixed(2)}
                            </span>
                        </div>
                    )}

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

                    {/* If disabled => show a short warning above the button */}
                    {!canProceed() && (
                        <div className="p-2 text-red-600 text-sm bg-red-50 border-l-4 border-red-300 rounded-md">
                            Please check if all info is filled
                        </div>
                    )}

                    {/* Checkout button */}
                    <button
                        onClick={handleCheckout}
                        disabled={!canProceed()}
                        className={`
      w-full mt-2 text-white font-medium py-2 rounded-xl focus:outline-none 
      transition-colors 
      ${!canProceed() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
    `}
                        style={{
                            backgroundColor: canProceed() ? brandColor : "#9ca3af", // fallback if disabled
                        }}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>

        </div>
    );
}
