'use client'

import React, { useRef, MouseEvent } from 'react'
import { CSSTransition } from 'react-transition-group'
import { useCart } from './CartContext'
import { FiX } from 'react-icons/fi'

type Props = {
    isOpen: boolean
    onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: Props) {
    const {
        items,
        updateItemQuantity,
        removeItem,
        clearCart,
        getCartTotal,
    } = useCart()

    // We want a fade for the overlay and a slide for the drawer
    // So we keep separate refs for each part
    const overlayRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)

    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    function handleQuantityChange(productId: string, newQty: number) {
        updateItemQuantity(productId, newQty)
    }

    const cartTotal = getCartTotal()

    return (
        <>
            {/* 1) Fade in/out the dark overlay behind the cart */}
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

            {/* 2) Slide in/out the cart panel (from right) */}
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
            fixed 
            top-0
            right-0
            bottom-0
            z-[9999]
            w-80
            bg-white
            p-4
            flex
            flex-col
            shadow-lg
          "
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="ml-auto mb-2 text-gray-700 hover:text-black"
                    >
                        <FiX size={20} />
                    </button>

                    <h2 className="text-lg font-bold mb-2">Your Cart</h2>

                    {items.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Cart is empty.
                        </div>
                    )}

                    {/* Cart items */}
                    <div className="flex-1 overflow-auto">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="border-b border-gray-200 py-2 flex items-center gap-2"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {item.productName}
                                        <span className="text-sm text-gray-600">
                                            <br />
                                            ( €{item.price.toFixed(2)} )
                                        </span>
                                    </div>
                                    {item.subproducts && item.subproducts.length > 0 && (
                                        <ul className="ml-3 text-sm text-gray-500 list-disc list-inside mt-1">
                                            {item.subproducts.map((sp) => (
                                                <li key={sp.id}>
                                                    {sp.name_nl} (+€{sp.price.toFixed(2)})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.note && (
                                        <div className="text-sm italic mt-1">
                                            Note: {item.note}
                                        </div>
                                    )}
                                </div>

                                {/* Quantity controls */}
                                <div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="px-2 py-1 border"
                                            onClick={() =>
                                                handleQuantityChange(
                                                    item.productId,
                                                    item.quantity - 1
                                                )
                                            }
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center">{item.quantity}</span>
                                        <button
                                            className="px-2 py-1 border"
                                            onClick={() =>
                                                handleQuantityChange(
                                                    item.productId,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="text-xs text-red-500 mt-1"
                                        onClick={() => removeItem(item.productId)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* If not empty, show buttons */}
                    {items.length > 0 && (
                        <div className="mt-2">
                            <button
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 mb-2"
                                onClick={clearCart}
                            >
                                Clear Cart
                            </button>
                            <button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                                onClick={() => {
                                    // e.g. window.location.href = '/checkout'
                                }}
                            >
                                Proceed to Checkout ( €{cartTotal.toFixed(2)} )
                            </button>
                        </div>
                    )}
                </div>
            </CSSTransition>
        </>
    )
}
