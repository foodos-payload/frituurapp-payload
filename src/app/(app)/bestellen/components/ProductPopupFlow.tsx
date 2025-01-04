// File: /app/(app)/bestellen/components/ProductPopupFlow.tsx
'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import { useCart, CartItem } from './cart/CartContext';

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
    image?: {
        url: string;
        alt: string;
    } | null;
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
     * you can pass that item here. If present, we will pre-fill the selections
     * and eventually call `updateItem(...)` instead of `addItem(...)`.
     */
    editingItem?: CartItem;

    /**
     * The unique line-item signature for the cart item being edited.
     * (Provided by BestellenLayout / CartDrawer via getLineItemSignature.)
     */
    editingItemSignature?: string;

    /** Called when the popup flow is closed (after add or cancel). */
    onClose: () => void;
}

/**
 * The main ProductPopupFlow component.
 * - Renders each popup in order.
 * - Lets user pick subproducts.
 * - On "Finish" => either add a new line or update the existing line in cart.
 */
export default function ProductPopupFlow({
    product,
    editingItem,
    editingItemSignature,
    onClose,
}: Props) {
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

    // If no popups exist, we don't need the flow at all
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

    const { id: popupID, popup_title_nl, multiselect, subproducts } = popup;

    /**
     * D) Maintain selected subproduct IDs for each popup:
     *    { [popupID]: ["sub-1", "sub-2"] }
     *
     * If "editingItem" is provided, we can prefill from editingItem.subproducts.
     */
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
        // If not editing, start empty
        if (!editingItem || !editingItem.subproducts) return {};

        // ----- Example approach -----
        // If you want to properly prefill, you'd store the popup ID
        // somewhere on each subproduct so you know which popup it belongs to.
        // For now, we'll skip it or do a naive approach to see if we can guess.
        return {};
    });

    // The currently selected IDs for *this* popup ID:
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

        for (const popupItem of sortedPopups) {
            if (!popupItem.popup) continue;
            const pId = popupItem.popup.id;
            const chosenIDs = selectedOptions[pId] || [];

            for (const sub of popupItem.popup.subproducts) {
                if (!chosenIDs.includes(sub.id)) continue;

                if (sub.linkedProduct) {
                    chosenSubs.push({
                        id: sub.linkedProduct.id,
                        name_nl: sub.linkedProduct.name_nl,
                        price: sub.linkedProduct.price ?? 0,
                    });
                } else {
                    chosenSubs.push({
                        id: sub.id,
                        name_nl: sub.name_nl,
                        price: sub.price,
                    });
                }
            }
        }

        // 2) Base product price
        const basePrice = product.price ?? 0;

        // 3) If we are "editing" => call updateItem, else addItem
        if (editingItem && editingItemSignature) {
            // We'll update that line item => subproducts
            const partialUpdates = {
                price: basePrice,
                subproducts: chosenSubs,
                hasPopups: true,
            };

            updateItem(editingItemSignature, partialUpdates);
        } else {
            // 4) If new => add as a new line item
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

        // 5) Close
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-md shadow-md max-w-md w-full p-4 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-2">{product.name_nl}</h2>
                <p className="mb-4 text-gray-600">
                    Popup {currentIndex + 1} of {sortedPopups.length}:
                    <strong> {popup_title_nl}</strong>
                </p>

                {/* Subproduct list */}
                <div className="space-y-2">
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
                                className={`
                  border p-2 rounded cursor-pointer hover:bg-gray-100
                  flex items-center justify-between gap-2
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                `}
                            >
                                <div className="flex items-center gap-2">
                                    {displayImage?.url && (
                                        <img
                                            src={displayImage.url}
                                            alt={displayImage.alt}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}
                                    <span>{displayName}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    €{displayPrice.toFixed(2)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Nav Buttons */}
                <div className="mt-4 flex justify-between">
                    <button
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                        onClick={handleBack}
                        disabled={currentIndex === 0}
                    >
                        Back
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleNext}
                    >
                        {currentIndex < sortedPopups.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    );
}
