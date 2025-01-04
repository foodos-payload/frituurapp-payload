'use client';

import React, { useRef, MouseEvent } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useCart, CartItem, getLineItemSignature } from './CartContext';
import { FiX, FiTrash2 } from 'react-icons/fi';

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
};

export default function CartDrawer({ isOpen, onClose, onEditItem, branding }: Props) {
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

    const cartTotal = getCartTotal();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const hasItems = items.length > 0;

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
                classNames="slideCart"
                unmountOnExit
                nodeRef={drawerRef}
            >
                <div
                    ref={drawerRef}
                    className="
            fixed top-0 bottom-0 right-0 z-[9999]
            flex flex-col w-full max-w-lg md:w-11/12
            bg-white shadow-lg overflow-hidden
          "
                >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        {/* Close */}
                        <button
                            onClick={onClose}
                            title="Close Drawer"
                            className="bg-red-500 text-white rounded-xl shadow-xl p-3"
                            style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                            <FiX className="w-6 h-6" />
                        </button>

                        {/* Title */}
                        <h2 className="text-lg font-semibold">
                            Winkelwagen <span className="text-sm">({itemCount})</span>
                        </h2>

                        {/* Clear entire cart */}
                        {hasItems ? (
                            <button
                                onClick={clearCart}
                                title="Clear entire cart"
                                className="bg-white p-3 rounded-xl shadow hover:bg-gray-100 transition-colors"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                            >
                                <FiTrash2 className="w-6 h-6 text-gray-700 hover:text-red-600" />
                            </button>
                        ) : (
                            <div style={{ width: '44px', height: '44px' }} />
                        )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 overflow-y-auto">
                        {!hasItems ? (
                            <div className="text-gray-500 flex items-center justify-center h-full">
                                Cart is empty.
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-4 p-4 md:p-6">
                                {items.map((item) => {
                                    const lineSig = getLineItemSignature(item);
                                    return (
                                        <li key={lineSig}>
                                            <div
                                                className="
                          rounded-lg flex w-full
                          overflow-hidden relative items-center
                          bg-white shadow-sm
                        "
                                                style={{ minHeight: '80px' }}
                                            >
                                                {/* Thumbnail */}
                                                {item.image?.url ? (
                                                    <img
                                                        src={item.image.url}
                                                        alt={item.image.alt ?? item.productName}
                                                        className="w-16 h-16 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100" />
                                                )}

                                                {/* Right side */}
                                                <div className="flex-1 min-h-[60px] ml-3">
                                                    <div className="font-semibold text-md line-clamp-2">
                                                        {item.productName}
                                                    </div>

                                                    {/* Subproducts */}
                                                    {item.subproducts && item.subproducts.length > 0 && (
                                                        <ul className="ml-3 text-sm text-gray-500 list-disc list-inside mt-1">
                                                            {item.subproducts.map((sp) => (
                                                                <li key={sp.id}>
                                                                    {sp.name_nl} (+€{sp.price.toFixed(2)})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {/* Price */}
                                                    <div className="text-sm mt-1 flex items-center">
                                                        <span className="font-semibold">
                                                            €{item.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity + actions */}
                                                <div className="inline-flex gap-1 flex-col items-end mr-2">
                                                    <div className="flex rounded bg-white text-sm leading-none shadow-sm">
                                                        {/* Decrement */}
                                                        <button
                                                            title="Decrease Quantity"
                                                            aria-label="Decrease Quantity"
                                                            type="button"
                                                            className="
                                focus:outline-none border-r w-10 h-10
                                border rounded-l border-gray-300
                                hover:bg-gray-50
                              "
                                                            onClick={() =>
                                                                handleQuantityChange(item, item.quantity - 1)
                                                            }
                                                        >
                                                            -
                                                        </button>

                                                        <div
                                                            className="
                                flex items-center justify-center
                                w-8 px-2 text-center text-sm
                                border-y border-gray-300
                              "
                                                        >
                                                            {item.quantity}
                                                        </div>

                                                        {/* Increment */}
                                                        <button
                                                            title="Increase Quantity"
                                                            aria-label="Increase Quantity"
                                                            type="button"
                                                            className="
                                focus:outline-none border-l w-10 h-10
                                border rounded-r hover:bg-gray-50
                                border-gray-300 p-2
                              "
                                                            onClick={() =>
                                                                handleQuantityChange(item, item.quantity + 1)
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Edit / Remove row */}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {item.hasPopups && onEditItem && (
                                                            <button
                                                                className="text-xs text-blue-500 hover:underline"
                                                                onClick={() => onEditItem(item)}
                                                            >
                                                                Bewerken
                                                            </button>
                                                        )}

                                                        {/* Remove single item */}
                                                        <button
                                                            className="
                                text-sm text-gray-400
                                hover:text-red-500 cursor-pointer
                              "
                                                            onClick={() => handleRemoveItem(item)}
                                                            title="Remove this item"
                                                        >
                                                            <FiTrash2 size={16} />
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
                                    // e.g. location.href = '/checkout'
                                }}

                                style={{
                                    borderRadius: '0.5rem',
                                    backgroundColor: brandCTA,
                                }}
                                className="
                  text-white
                  block w-full p-3 text-lg text-center rounded-lg shadow-md
                  font-semibold 
                "
                            >
                                Afrekenen
                                <span className="mx-2">€{cartTotal.toFixed(2)}</span>
                            </button>
                        </div>
                    )}
                </div>
            </CSSTransition>
        </>
    );
}
