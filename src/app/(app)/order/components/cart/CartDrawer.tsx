"use client";

import React, { useRef, MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CSSTransition } from "react-transition-group";
import { FiX, FiTrash2 } from "react-icons/fi";
import PromoButton from "@/app/(app)/shared/PromoButton";

import {
    useCart,
    CartItem,
    getLineItemSignature,
} from "@/context/CartContext"; // Adjust import path as needed
import { useTranslation } from "@/context/TranslationsContext"; // Adjust if you have a different translation context

/** Optional branding type for custom colors/styles. */
type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
};

/** 
 * Props for the CartDrawer component.
 */
type Props = {
    isOpen: boolean;
    onClose: () => void;
    onEditItem?: (item: CartItem) => void;
    branding?: Branding;
    isKiosk?: boolean;
};

export default function CartDrawer({
    isOpen,
    onClose,
    onEditItem,
    branding,
    isKiosk = false,
}: Props) {
    const { t, locale } = useTranslation();
    const router = useRouter();

    // Access the cart context
    const {
        items,
        updateItemQuantity,
        removeItem,
        clearCart,
        // base total
        getCartTotal,
        // final total after coupon/gift/points/credits
        getCartTotalWithDiscounts,
    } = useCart();

    // Refs for CSSTransition
    const overlayRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Branding color for the checkout button
    const brandCTA = branding?.primaryColorCTA || "#068b59";

    // Original vs discounted
    const originalTotal = getCartTotal();
    const discountedTotal = getCartTotalWithDiscounts();

    // Basic item count
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasItems = items.length > 0;

    /** If user clicks overlay => close the drawer. */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    /** Increase/decrease item quantity. */
    function handleQuantityChange(item: CartItem, newQty: number) {
        const lineSig = getLineItemSignature(item);
        updateItemQuantity(lineSig, newQty);
    }

    /** Remove item. */
    function handleRemoveItem(item: CartItem) {
        const lineSig = getLineItemSignature(item);
        removeItem(lineSig);
    }

    /**
     * Local spinner states for the "Checkout" button:
     * "idle" => user hasn't clicked yet
     * "loading" => user clicked => show spinner until route transition or delay
     */
    const [checkoutLoadingState, setCheckoutLoadingState] = useState<"idle" | "loading">("idle");

    /** Checkout => navigate to /checkout */
    async function handleCheckoutClick() {
        if (!hasItems || checkoutLoadingState === "loading") return;

        // Start spinner
        setCheckoutLoadingState("loading");

        // You might do an async call here if needed, or rely on route transitions:
        const kioskParam = isKiosk ? "?kiosk=true" : "";
        router.push(`/checkout${kioskParam}`);

        // You can optionally set a small timeout if the route transitions quickly:
        // setTimeout(() => setCheckoutLoadingState("idle"), 2000);
    }

    // Some kiosk-specific styling
    const kioskHeaderText = isKiosk ? "text-2xl" : "text-lg";
    const kioskHeaderPadding = isKiosk ? "p-6" : "p-4";
    const kioskEmptyText = isKiosk ? "text-xl" : "text-gray-500";
    const kioskItemSpacing = isKiosk ? "gap-6" : "gap-4";
    const kioskItemPadding = isKiosk ? "p-6 text-xl" : "p-4 md:p-6";
    const kioskQuantityBtnSize = isKiosk ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm";

    // Font sizes for discount lines
    const discountContainerClasses = isKiosk
        ? "text-xl text-green-600 flex flex-col"
        : "text-sm text-green-600 flex flex-col";

    return (
        <>
            {/* Fade overlay */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeOverlay"
                unmountOnExit
                nodeRef={overlayRef}
            >
                <div
                    ref={overlayRef}
                    className="fixed inset-0 z-[9998] bg-black/50"
                    onClick={handleOverlayClick}
                />
            </CSSTransition>

            {/* Slide drawer */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames={isKiosk ? "slideUpCart" : "slideCart"}
                unmountOnExit
                nodeRef={drawerRef}
            >
                <div
                    ref={drawerRef}
                    className={`
            fixed
            ${isKiosk ? "bottom-0 left-0 right-0 top-auto" : "top-0 right-0 bottom-0"}
            z-[9999]
            flex flex-col
            ${isKiosk ? "w-full min-h-[40vh] max-h-[90vh]" : "w-full max-w-lg"}
            ${isKiosk ? "rounded-t-2xl" : "md:w-11/12"}
            bg-white shadow-lg overflow-hidden
          `}
                >
                    {/* Top bar */}
                    <div
                        className={`flex items-center justify-between border-b border-gray-200 ${kioskHeaderPadding}`}
                    >
                        <button
                            onClick={onClose}
                            title="Close Drawer"
                            className="bg-red-500 text-white rounded-xl shadow-xl p-3"
                            style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                            <FiX className="w-6 h-6" />
                        </button>

                        <h2 className={`${kioskHeaderText} font-semibold`}>
                            {t("order.cart.title")}{" "}
                            <span className={isKiosk ? "text-xl" : "text-sm"}>
                                ({itemCount})
                            </span>
                        </h2>

                        {hasItems ? (
                            <button
                                onClick={clearCart}
                                title="Clear entire cart"
                                className="bg-white p-3 rounded-xl shadow hover:bg-gray-100 transition-colors"
                                style={{ minWidth: "44px", minHeight: "44px" }}
                            >
                                <FiTrash2 className="w-6 h-6 text-gray-700 hover:text-red-600" />
                            </button>
                        ) : (
                            <div style={{ width: "44px", height: "44px" }} />
                        )}
                    </div>

                    {/* Body => Cart Items */}
                    <div className="flex-1 overflow-y-auto">
                        {!hasItems ? (
                            <div className={`flex items-center justify-center h-full ${kioskEmptyText}`}>
                                {t("order.cart.empty")}
                            </div>
                        ) : (
                            <ul className={`flex flex-col ${kioskItemSpacing} ${kioskItemPadding}`}>
                                {items.map((item) => {
                                    const lineSig = getLineItemSignature(item);
                                    const displayName = pickCartItemName(item, locale);

                                    return (
                                        <li key={lineSig}>
                                            <div
                                                className="rounded-lg flex w-full overflow-hidden relative items-center bg-white shadow-sm"
                                                style={{
                                                    minHeight: isKiosk ? "110px" : "80px",
                                                }}
                                            >
                                                {/* Thumbnail */}
                                                {item.image?.url ? (
                                                    <img
                                                        src={item.image.url}
                                                        alt={item.image.alt ?? item.productName}
                                                        className={`rounded-md object-cover ${isKiosk ? "w-20 h-20" : "w-16 h-16"
                                                            }`}
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100" />
                                                )}

                                                {/* Right side => name, subproducts, price */}
                                                <div className="flex-1 min-h-[60px] ml-3">
                                                    <div
                                                        className={`font-semibold ${isKiosk ? "text-xl" : "text-md"
                                                            } line-clamp-2`}
                                                    >
                                                        {displayName}
                                                    </div>

                                                    {/* Subproducts */}
                                                    {item.subproducts && item.subproducts.length > 0 && (
                                                        <ul className="ml-3 text-sm text-gray-500 list-disc list-inside mt-1">
                                                            {item.subproducts.map((sp, index) => {
                                                                const subName = pickCartSubName(sp, locale);
                                                                const uniqueKey = sp.subproductId + "-" + index;
                                                                return (
                                                                    <li key={uniqueKey}>
                                                                        {subName}
                                                                        {sp.quantity && sp.quantity > 1 && (
                                                                            <span> x{sp.quantity}</span>
                                                                        )}
                                                                        (+€{sp.price.toFixed(2)})
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}

                                                    {/* Price */}
                                                    <div className="text-sm mt-1 flex items-center">
                                                        <span
                                                            className={`font-semibold ${isKiosk ? "text-lg" : "text-md"
                                                                }`}
                                                        >
                                                            €{item.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity + actions */}
                                                <div className="inline-flex gap-1 flex-col items-end mr-2">
                                                    <div className="flex rounded bg-white text-sm leading-none shadow-sm">
                                                        <button
                                                            title="Decrease Quantity"
                                                            aria-label="Decrease Quantity"
                                                            type="button"
                                                            className={`
                                focus:outline-none border-r
                                border rounded-l border-gray-300
                                hover:bg-gray-50
                                ${kioskQuantityBtnSize}
                              `}
                                                            onClick={() =>
                                                                handleQuantityChange(item, item.quantity - 1)
                                                            }
                                                        >
                                                            -
                                                        </button>
                                                        <div
                                                            className={`
                                flex items-center justify-center
                                border-y border-gray-300
                                text-center
                                px-2
                                ${isKiosk
                                                                    ? "w-10 text-lg"
                                                                    : "w-8 text-sm"
                                                                }
                              `}
                                                        >
                                                            {item.quantity}
                                                        </div>
                                                        <button
                                                            title="Increase Quantity"
                                                            aria-label="Increase Quantity"
                                                            type="button"
                                                            className={`
                                focus:outline-none border-l
                                border rounded-r hover:bg-gray-50
                                border-gray-300 p-2
                                ${kioskQuantityBtnSize}
                              `}
                                                            onClick={() =>
                                                                handleQuantityChange(item, item.quantity + 1)
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Edit / Remove */}
                                                    <div
                                                        className={`flex items-center gap-3 mt-1 ${isKiosk ? "text-lg" : ""
                                                            }`}
                                                    >
                                                        {item.hasPopups && onEditItem && (
                                                            <button
                                                                className={`text-blue-500 hover:underline ${isKiosk ? "text-lg" : "text-xs"
                                                                    }`}
                                                                onClick={() => onEditItem(item)}
                                                            >
                                                                {t("order.cart.edit_product")}
                                                            </button>
                                                        )}

                                                        <button
                                                            className={`
                                text-sm text-gray-400
                                hover:text-red-500 cursor-pointer
                                ${isKiosk ? "text-xl" : ""}
                              `}
                                                            onClick={() => handleRemoveItem(item)}
                                                            title="Remove this item"
                                                        >
                                                            <FiTrash2 size={isKiosk ? 20 : 16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer => discount line + apply code + checkout */}
                    {hasItems && (
                        <div className="px-8 mb-4 pt-3 flex flex-col gap-3">
                            {/* If discount is active => show old & new total */}
                            {discountedTotal < originalTotal ? (
                                <div className={discountContainerClasses}>
                                    <span>
                                        {t("order.cart.original_total")} €
                                        {originalTotal.toFixed(2)}
                                    </span>
                                    <span className="font-semibold">
                                        {t("order.cart.discounted_total")} €
                                        {discountedTotal.toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    className={`${isKiosk ? "text-xl" : "text-md"
                                        } font-semibold`}
                                >
                                    {/* If no discount, you could show "Subtotal" here if desired */}
                                </div>
                            )}

                            {/* Button to open the promo modal => bigger in kiosk mode */}
                            <PromoButton
                                label="Apply Promo or Scan QR"
                                // In kiosk mode => bigger text/padding
                                buttonClass={isKiosk ? "p-5 text-2xl" : ""}
                                isKiosk={isKiosk}
                            />

                            {/* Checkout button with spinner */}
                            <button
                                onClick={handleCheckoutClick}
                                disabled={checkoutLoadingState === "loading"}
                                style={{
                                    borderRadius: "0.5rem",
                                    backgroundColor: brandCTA,
                                }}
                                className={`
                  text-white
                  block w-full text-center rounded-lg shadow-md
                  font-semibold
                  ${isKiosk ? "p-5 text-2xl" : "p-3 text-lg"}
                  disabled:opacity-50
                `}
                            >
                                {checkoutLoadingState === "loading" ? (
                                    <SpinnerIcon />
                                ) : (
                                    // Show normal text if not loading
                                    <>
                                        {t("order.cart.checkout")}{" "}
                                        {discountedTotal < originalTotal ? (
                                            <span className="mx-2">
                                                €{discountedTotal.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="mx-2">
                                                €{originalTotal.toFixed(2)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </CSSTransition>
        </>
    );
}

/** 
 * Helper to pick the localized name for the cart item 
 * based on the user's locale.
 */
function pickCartItemName(item: CartItem, locale: string): string {
    switch (locale) {
        case "en":
            return item.productNameEN ?? item.productName;
        case "fr":
            return item.productNameFR ?? item.productName;
        case "de":
            return item.productNameDE ?? item.productName;
        default:
            return item.productNameNL ?? item.productName;
    }
}

/** 
 * Helper to pick a subproduct's localized name.
 */
function pickCartSubName(
    sp: { name_nl: string; name_en?: string; name_de?: string; name_fr?: string },
    locale: string
) {
    switch (locale) {
        case "en":
            return sp.name_en ?? sp.name_nl;
        case "fr":
            return sp.name_fr ?? sp.name_nl;
        case "de":
            return sp.name_de ?? sp.name_nl;
        default:
            return sp.name_nl;
    }
}

/** 
 * A simple spinner icon
 */
function SpinnerIcon() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="animate-spin mx-auto"
            strokeWidth="3"
            fill="none"
            stroke="currentColor"
        >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
        </svg>
    );
}
