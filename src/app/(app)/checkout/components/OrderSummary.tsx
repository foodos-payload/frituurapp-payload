"use client";

import React, { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useCart, getLineItemSignature } from "@/context/CartContext";
import PromoButton from "../../shared/PromoButton";

type Branding = {
    /** e.g. "#ECAA02" or some other brand color */
    primaryColorCTA?: string;
};

interface OrderSummaryProps {
    couponCode: string;
    setCouponCode: (value: string) => void;
    handleScanQR: () => void;
    handleApplyCoupon: () => void;
    canProceed: () => boolean;
    /** The real checkout function from CheckoutPage. */
    handleCheckout: () => Promise<number | null>;

    cartTotal: number; // not used directly, but you have it
    discountedSubtotal: number;
    rawSubtotal: number;
    shippingCost: number;
    finalTotal: number;
    fulfillmentMethod: "delivery" | "takeaway" | "dine_in" | "";
    branding: Branding;
}

/**
 * OrderSummary with local spinner logic on the "Proceed to Checkout" button.
 * 
 * Because `handleCheckout()` does the real fetch + router logic, 
 * you might see the spinner for a short time if the route transitions quickly.
 */
export default function OrderSummary({
    canProceed,
    handleCheckout,
    shippingCost,
    finalTotal,
    fulfillmentMethod,
    discountedSubtotal,
    rawSubtotal,
    branding,
    couponCode,
    setCouponCode,
    handleScanQR,
    handleApplyCoupon,
}: OrderSummaryProps) {
    const {
        items: cartItems,
        updateItemQuantity,
        removeItem,
    } = useCart();

    const discount = rawSubtotal - discountedSubtotal;
    const hasDiscount = discount > 0;

    // Use brand color or fallback
    const brandColor = branding.primaryColorCTA || "#22c55e";

    // Local spinner states: "idle" | "loading" | "check"
    const [loadingState, setLoadingState] = useState<"idle" | "loading" | "check">("idle");

    /** 
     * The user clicks “Proceed to Checkout.”
     * We show a local spinner, call `handleCheckout()`, 
     * then briefly show a check icon, and reset to "idle" 
     * unless the page navigates away.
     */
    async function handleCheckoutClick() {
        // If cannot proceed or already loading, do nothing.
        if (!canProceed() || loadingState === "loading") return;

        // Show spinner
        setLoadingState("loading");

        // Call the real checkout logic
        await handleCheckout();

        // Show check icon
        setLoadingState("check");
        setTimeout(() => {
            setLoadingState("idle");
        }, 1000);
    }

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

    function getSubLine(subName: string, subPrice: number) {
        return `${subName} (+€${subPrice.toFixed(2)})`;
    }

    return (
        <div className="sticky top-4 space-y-6 rounded-xl shadow-md">
            <div className="bg-white p-4 space-y-1">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
                    <p className="text-gray-500 text-sm">Review your items and confirm below.</p>
                </div>

                {/* Cart Items */}
                {cartItems.length === 0 ? (
                    <p className="text-gray-500">No items in cart.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {cartItems.map((item, idx) => {
                            const displayName = item.productName || "Untitled Product";
                            const subTotal = item.subproducts?.reduce((acc, sp) => acc + sp.price, 0) || 0;
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

                {/* Example: “Apply Promo or Scan QR” button */}
                <PromoButton label="Apply Promo or Scan QR" buttonClass="bg-blue-100 ..." />

                {/* Totals + Checkout */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                    {/* If discount => show raw Subtotal + discount line */}
                    {hasDiscount ? (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Subtotal</span>
                                <span className="text-gray-900 font-semibold">
                                    €{rawSubtotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-green-600">
                                <span className="font-medium">Discount</span>
                                <span className="font-semibold">–€{discount.toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        // If no discount, just show discountedSubtotal as "Subtotal"
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Subtotal</span>
                            <span className="text-gray-900 font-semibold">
                                €{discountedSubtotal.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* If "delivery" => show shipping */}
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

                    {/* If disabled => short warning */}
                    {!canProceed() && (
                        <div className="p-2 text-red-600 text-sm bg-red-50 border-l-4 border-red-300 rounded-md">
                            Please check if all info is filled
                        </div>
                    )}

                    {/* Local Spinner Button */}
                    <button
                        onClick={handleCheckoutClick}
                        disabled={!canProceed() || loadingState === "loading"}
                        className={`
              w-full mt-2 text-white font-medium py-2 rounded-xl focus:outline-none 
              transition-colors 
              ${!canProceed() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
            `}
                        style={{
                            backgroundColor: canProceed() ? brandColor : "#9ca3af",
                        }}
                    >
                        {loadingState === "loading" ? (
                            // Simple spinner
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="animate-spin mx-auto"
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                            >
                                <circle cx="12" cy="12" r="10" className="opacity-20" />
                                <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                            </svg>
                        ) : loadingState === "check" ? (
                            // Check icon
                            <svg
                                width="24"
                                height="24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                className="mx-auto"
                            >
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            // Default text
                            "Proceed to Checkout"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
