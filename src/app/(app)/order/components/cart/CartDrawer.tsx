"use client";

import React, { useRef, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { CSSTransition } from "react-transition-group";
import { useCart, CartItem, getLineItemSignature } from "../../../../../context/CartContext";
import { FiX, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "@/context/TranslationsContext";

type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    // ... any others if needed
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    /** Called when user wants to "edit" a popup-based item. */
    onEditItem?: (item: CartItem) => void;
    branding?: Branding;
    userLang?: string;
    isKiosk?: boolean;
};

export default function CartDrawer({
    isOpen,
    onClose,
    onEditItem,
    branding,
    userLang,
    isKiosk = false,
}: Props) {
    const { t } = useTranslation()
    const router = useRouter();
    const {
        items,
        updateItemQuantity,
        removeItem,
        clearCart,
        getCartTotal,
    } = useCart();

    const overlayRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    const brandCTA = branding?.primaryColorCTA || "#3b82f6";
    const cartTotal = getCartTotal();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasItems = items.length > 0;

    /**
     * Close drawer if user clicks outside the drawer
     */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    /**
     * Update the cart item’s quantity by line signature
     */
    function handleQuantityChange(item: CartItem, newQty: number) {
        const lineSig = getLineItemSignature(item);
        updateItemQuantity(lineSig, newQty);
    }

    /**
     * Remove a cart item by line signature
     */
    function handleRemoveItem(item: CartItem) {
        const lineSig = getLineItemSignature(item);
        removeItem(lineSig);
    }

    // === Some kiosk-specific variables for minimal style adjustments ===
    const kioskHeaderText = isKiosk ? "text-2xl" : "text-lg";
    const kioskHeaderPadding = isKiosk ? "p-6" : "p-4";
    const kioskEmptyText = isKiosk ? "text-xl" : "text-gray-500";
    const kioskItemSpacing = isKiosk ? "gap-6" : "gap-4";
    const kioskItemPadding = isKiosk ? "p-6 text-xl" : "p-4 md:p-6";
    const kioskQuantityBtnSize = isKiosk ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm";
    const kioskFooterBtnText = isKiosk ? "text-2xl p-5" : "text-lg p-3";

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
                    {/* Top Bar */}
                    <div className={`flex items-center justify-between border-b border-gray-200 ${kioskHeaderPadding}`}>
                        {/* Close */}
                        <button
                            onClick={onClose}
                            title="Close Drawer"
                            className="bg-red-500 text-white rounded-xl shadow-xl p-3"
                            style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                            <FiX className="w-6 h-6" />
                        </button>

                        {/* Title */}
                        <h2 className={`${kioskHeaderText} font-semibold`}>
                            {t("order.cart.title")}{" "}
                            <span className={isKiosk ? "text-xl" : "text-sm"}>
                                ({itemCount})
                            </span>
                        </h2>

                        {/* Clear entire cart */}
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

                    {/* Main content */}
                    <div className="flex-1 overflow-y-auto">
                        {!hasItems ? (
                            <div
                                className={`
                  flex items-center justify-center h-full
                  ${kioskEmptyText}
                `}
                            >
                                {t("order.cart.empty")}
                            </div>
                        ) : (
                            <ul className={`flex flex-col ${kioskItemSpacing} ${kioskItemPadding}`}>
                                {items.map((item) => {
                                    const lineSig = getLineItemSignature(item);
                                    const displayName = pickCartItemName(
                                        item,
                                        userLang ?? "nl"
                                    );

                                    return (
                                        <li key={lineSig}>
                                            <div
                                                className="
                          rounded-lg flex w-full
                          overflow-hidden relative items-center
                          bg-white shadow-sm
                        "
                                                style={{ minHeight: isKiosk ? "110px" : "80px" }}
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

                                                {/* Right side */}
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
                                                            {item.subproducts.map((sp) => {
                                                                const subName = pickCartSubName(
                                                                    sp,
                                                                    userLang ?? "nl"
                                                                );
                                                                return (
                                                                    <li key={sp.id}>
                                                                        {subName} (+€{sp.price.toFixed(2)})
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}

                                                    {/* Price */}
                                                    <div className="text-sm mt-1 flex items-center">
                                                        <span className={`font-semibold ${isKiosk ? "text-lg" : "text-md"
                                                            }`}>
                                                            €{item.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity + actions */}
                                                <div className="inline-flex gap-1 flex-col items-end mr-2">
                                                    <div
                                                        className={`
                              flex rounded bg-white text-sm leading-none shadow-sm
                            `}
                                                    >
                                                        {/* Decrement */}
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
                                ${isKiosk ? "w-10 text-lg" : "w-8 text-sm"}
                              `}
                                                        >
                                                            {item.quantity}
                                                        </div>

                                                        {/* Increment */}
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

                                                    {/* Edit / Remove row */}
                                                    <div className={`flex items-center gap-3 mt-1 ${isKiosk ? "text-lg" : ""
                                                        }`}>
                                                        {item.hasPopups && onEditItem && (
                                                            <button
                                                                className={` text-blue-500 hover:underline ${isKiosk ? "text-lg" : "text-xs"
                                                                    }`}
                                                                onClick={() => onEditItem(item)}
                                                            >
                                                                <span className={` text-blue-500 hover:underline ${isKiosk ? "text-lg" : "text-xs"
                                                                    }`}>{t("order.cart.edit_product")}</span>
                                                            </button>
                                                        )}

                                                        {/* Remove single item */}
                                                        <button
                                                            className={`
                                text-sm text-gray-400
                                hover:text-red-500 cursor-pointer
                                ${isKiosk ? "text-xl" : ""}
                              `}
                                                            onClick={() => handleRemoveItem(item)}
                                                            title="Remove this item"
                                                        >
                                                            <FiTrash2
                                                                size={isKiosk ? 20 : 16}
                                                            />
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

                    {/* Footer total + checkout */}
                    {hasItems && (
                        <div className="px-8 mb-4 pt-3">
                            <button
                                onClick={() => {
                                    router.push("/checkout");
                                }}
                                style={{
                                    borderRadius: "0.5rem",
                                    backgroundColor: brandCTA,
                                }}
                                className={`
                  text-white
                  block w-full text-center rounded-lg shadow-md
                  font-semibold
                  ${isKiosk ? "p-5 text-2xl" : "p-3 text-lg"}
                `}
                            >
                                {t("order.cart.checkout")}{" "}
                                <span className="mx-2">€{cartTotal.toFixed(2)}</span>
                            </button>
                        </div>
                    )}
                </div>
            </CSSTransition>
        </>
    );
}

/** Helper to pick the correct product name from a CartItem */
function pickCartItemName(item: CartItem, userLang: string): string {
    switch (userLang) {
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

/** Helper to pick the correct subproduct name */
function pickCartSubName(
    sp: { name_nl: string; name_en?: string; name_de?: string; name_fr?: string },
    userLang: string
) {
    switch (userLang) {
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
