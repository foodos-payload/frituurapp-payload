// File: /app/(app)/bestellen/components/ProductPopupFlow.tsx
'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import { useCart, CartItem } from './cart/CartContext';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * Types for your subproducts, popups, product, etc.
 */
type LinkedProductData = {
    id: string;
    name_nl: string;
    description_nl?: string;
    priceUnified: boolean;
    price: number | null;
    image?: {
        url: string;
        alt: string;
    } | null;
};

type Subproduct = {
    id: string;
    name_nl: string;
    price: number;
    image?: { url: string; alt?: string } | null;
    linkedProduct?: LinkedProductData;
};

type PopupDoc = {
    id: string;
    popup_title_nl: string;
    multiselect: boolean;
    minimum_option: number;
    maximum_option: number;
    subproducts: Subproduct[];
};

type PopupItem = {
    order: number;
    popup: PopupDoc | null;
};

/**
 * Minimal shape for your parent "Product" that is being customized.
 */
type Product = {
    id: string;
    name_nl: string;
    price?: number | null; // the base product price
    productpopups?: PopupItem[];
    image?: {
        url: string;
        alt: string;
    };
    // ...
};

interface Props {
    /** The product definition from your database, including popups. */
    product: Product;

    /**
     * If we are "editing" an existing cart item (with subproducts, etc.),
     * we can pre-fill from editingItem.subproducts.
     */
    editingItem?: CartItem;

    /**
     * The unique signature for the cart item being edited (from getLineItemSignature).
     */
    editingItemSignature?: string;

    /** Called when the popup flow is closed (after add or cancel). */
    onClose: () => void;
}

/**
 * ProductPopupFlow:
 * - Multi-step subproduct selection (like Vue).
 * - Slide-up + fade transitions.
 * - Sticky top banner with image & gradient overlay (like old Vue layout).
 * - “Tile-style” subproduct options in a grid (like in your Vue code).
 * - Checkmark icon on selected tiles.
 */
export default function ProductPopupFlow({
    product,
    editingItem,
    editingItemSignature,
    onClose,
}: Props) {
    console.log('[ProductPopupFlow] product:', product);

    const { addItem, updateItem } = useCart();

    /**
     * A) Lock body scroll while mounted
     */
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    /**
     * B) Sort + filter the product popups
     */
    const sortedPopups = (product.productpopups || [])
        .filter((p) => p.popup !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // If no popups exist => no flow needed
    if (sortedPopups.length === 0) {
        return null;
    }

    /**
     * C) Track which step (popup index) we are on
     */
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentPopupItem = sortedPopups[currentIndex];
    const popup = currentPopupItem?.popup;
    if (!popup) return null; // safeguard

    const { popup_title_nl, multiselect, subproducts } = popup;

    /**
     * D) Maintain selected subproduct IDs for each popup
     *    e.g. { [popupID]: ["sub-1", "sub-2"] }
     */
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
        // If editing => we might prefill. For brevity, we do an empty approach.
        if (!editingItem || !editingItem.subproducts) return {};
        return {};
    });

    const popupID = popup.id;
    const currentSelections = selectedOptions[popupID] || [];

    /**
     * E) Handler: click a subproduct => toggle or single-select
     */
    function handleSubproductClick(sub: Subproduct) {
        const subID = sub.id;
        setSelectedOptions((prev) => {
            const oldArray = prev[popupID] || [];
            let newArray: string[] = [];

            if (multiselect) {
                // Toggle
                if (oldArray.includes(subID)) {
                    newArray = oldArray.filter((id) => id !== subID);
                } else {
                    newArray = [...oldArray, subID];
                }
            } else {
                // Single select
                newArray = [subID];
            }

            return {
                ...prev,
                [popupID]: newArray,
            };
        });
    }

    /**
     * F) Next / Back / Finish
     */
    function handleNext() {
        if (currentIndex >= sortedPopups.length - 1) {
            handleFinish();
        } else {
            setCurrentIndex((i) => i + 1);
        }
    }

    function handleBack() {
        if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
        }
    }

    /**
     * G) On Finish => gather chosen subproducts => add or update
     */
    function handleFinish() {
        // 1) Gather all chosen subproducts from all popups
        const chosenSubs: { id: string; name_nl: string; price: number }[] = [];

        for (const popIt of sortedPopups) {
            if (!popIt.popup) continue;
            const pId = popIt.popup.id;
            const chosenIDs = selectedOptions[pId] || [];

            for (const sp of popIt.popup.subproducts) {
                if (!chosenIDs.includes(sp.id)) continue;

                if (sp.linkedProduct) {
                    chosenSubs.push({
                        id: sp.linkedProduct.id,
                        name_nl: sp.linkedProduct.name_nl,
                        price: sp.linkedProduct.price ?? 0,
                    });
                } else {
                    chosenSubs.push({
                        id: sp.id,
                        name_nl: sp.name_nl,
                        price: sp.price,
                    });
                }
            }
        }

        // 2) Base product price
        const basePrice = product.price ?? 0;

        // 3) If editing => update existing line item; else add new
        if (editingItem && editingItemSignature) {
            updateItem(editingItemSignature, {
                price: basePrice,
                subproducts: chosenSubs,
                hasPopups: true,
            });
        } else {
            addItem({
                productId: product.id,
                productName: product.name_nl,
                price: basePrice,
                quantity: 1,
                image: product.image
                    ? {
                        url: product.image.url,
                        alt: product.image.alt ?? product.name_nl,
                    }
                    : undefined,
                note: '',
                subproducts: chosenSubs,
                hasPopups: true,
            });
        }

        // 4) Close
        onClose();
    }

    /**
     * H) Close if user clicks the dark overlay
     */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    /**
     * I) Render
     */
    return (
        <div
            className="
        fixed inset-0 z-50
        flex flex-col
        items-center
        justify-end md:justify-center
        modal-fade-bg
      "
            onClick={onClose}
        >
            {/* Dark overlay fade */}
            <div
                className="
          absolute inset-0
          bg-black bg-opacity-70
          transition-opacity duration-300
          animate-fadeIn
        "
            />

            {/* Main container => Slide up on mobile */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="
          relative
          w-[100vw] md:w-[50vw]
          min-h-[70vh]
          max-h-[100vh] md:max-h-[90vh] md:min-h-[50vh]
          bg-white
          rounded-t-2xl md:rounded-b-2xl
          shadow-lg
          overflow-auto
          animate-slideUp
        "
            >
                {/* Sticky Image Banner */}
                <div className="relative sticky top-0 z-10 w-full h-[150px] md:h-[200px]">
                    {/* Product image as background */}
                    {product.image?.url && (
                        // Create a "safe" URL with spaces replaced (or fully encode)
                        (() => {
                            const safeUrl = encodeURI(product.image.url);

                            return (
                                <div
                                    className="
          absolute inset-0
          bg-cover bg-no-repeat bg-center
          opacity-90
        "
                                    style={{ backgroundImage: `url(${safeUrl})` }}
                                />
                            );
                        })()
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />

                    {/* Title, Price, & Close Button */}
                    <div className="relative flex flex-col items-center justify-end h-full pb-4">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="
                modal-close-button
                absolute
                top-4 right-4
                bg-red-600 text-white
                rounded-full p-2
                shadow
                hover:bg-red-700
                transition-colors
                z-50
              "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Product title + optional price in white */}
                        <div className="text-center text-white flex gap-2">
                            <h1 className="text-xl font-semibold font-secondary font-love-of-thunder">
                                {product.name_nl}
                            </h1>
                            {typeof product.price === 'number' && (
                                <span className="text-xl">
                                    €{product.price.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 w-[95%] mx-auto mb-14 mt-20">
                    {/* “Stap X van Y: popup_title_nl” */}
                    <h2 className="text-xl font-semibold mb-12 mt-2 text-center">
                        {popup_title_nl}
                    </h2>

                    {/* Subproduct “tile” grid */}
                    <div className="grid gap-4 mt-4 grid-cols-2 md:grid-cols-3">
                        {subproducts.map((sub) => {
                            const useLinked = !!sub.linkedProduct;
                            const displayName = useLinked ? sub.linkedProduct!.name_nl : sub.name_nl;
                            const displayPrice = useLinked ? sub.linkedProduct!.price ?? 0 : sub.price;
                            const displayImage = useLinked ? sub.linkedProduct?.image : sub.image;
                            const isSelected = currentSelections.includes(sub.id);

                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => handleSubproductClick(sub)}
                                    style={{ borderRadius: '0.5rem' }}
                                    className={`
                    relative
                    flex flex-col justify-between
                    p-2 border rounded-lg text-center cursor-pointer transition
                    ${isSelected
                                            ? 'bg-gray-100 border-l-4 border-green-500'
                                            : 'border-gray-300'
                                        }
                  `}
                                >
                                    {/* Possibly an image */}
                                    <div className="flex-grow flex items-center justify-center mb-4">
                                        {displayImage?.url && (
                                            <img
                                                src={displayImage.url}
                                                alt={displayImage.alt || displayName}
                                                className="w-auto max-h-[60px] object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Name + Price */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-gray-700 text-center text-md font-bold">
                                            {displayName}
                                        </span>
                                        <span className="text-sm text-gray-500 font-bold">
                                            {displayPrice > 0
                                                ? `(+ €${displayPrice.toFixed(2)})`
                                                : `€${displayPrice.toFixed(2)}`}
                                        </span>
                                    </div>

                                    {/* Checkmark in bottom-right if selected */}
                                    {isSelected && (
                                        <div className="absolute bottom-2 right-2 text-green-500">
                                            {/* Using e.g. react-icons FaCheckCircle */}
                                            <FiCheckCircle size={24} />
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom sticky Next/Back */}
                <div
                    className="
            sticky bottom-0 w-full
            bg-white bg-opacity-90
            z-50 p-4
            flex items-center justify-between
          "
                >
                    {currentIndex > 0 ? (
                        <button
                            onClick={handleBack}
                            className="
                bg-gray-500 text-white
                px-4 py-2
                rounded-full
                hover:bg-gray-600
                transition
              "
                        >
                            Terug
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleNext}
                        className="
              bg-green-600 text-white
              px-4 py-2
              rounded-full
              hover:bg-green-700
              transition
            "
                    >
                        {currentIndex < sortedPopups.length - 1 ? 'Volgende' : 'Bevestigen'}
                    </button>
                </div>
            </div>
        </div>
    );
}
