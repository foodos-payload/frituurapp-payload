// File: /app/(app)/bestellen/components/ProductPopupFlow.tsx
'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import { useCart, CartItem } from './cart/CartContext';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * Minimal subproduct/link types
 */
type LinkedProductData = {
    id: string;
    name_nl: string;
    price: number | null;
    image?: { url: string; alt: string } | null;
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
    subproducts: Subproduct[];
    // ...
};

type PopupItem = {
    order: number;
    popup: PopupDoc | null;
};

type Product = {
    id: string;
    name_nl: string;
    price?: number | null;
    image?: { url: string; alt: string };
    productpopups?: PopupItem[];
    // ...
};

type Branding = {
    /** e.g. "#ECAA02" or some other brand color */
    primaryColorCTA?: string;
    // ...
};

interface Props {
    product: Product;
    editingItem?: CartItem;
    editingItemSignature?: string;
    onClose: () => void;
    branding?: Branding;
}

export default function ProductPopupFlow({
    product,
    editingItem,
    editingItemSignature,
    onClose,
    branding,
}: Props) {
    const { addItem, updateItem } = useCart();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Sort + filter popups
    const sortedPopups = (product.productpopups || [])
        .filter((p) => p.popup !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sortedPopups.length === 0) return null;

    // Step state
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentPopupItem = sortedPopups[currentIndex];
    const popup = currentPopupItem?.popup;
    if (!popup) return null;

    const { popup_title_nl, multiselect, subproducts } = popup;

    // E.g. { [popupID]: [subId, subId] }
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
        // If editing => we might prefill. For brevity, we do an empty approach.
        if (!editingItem || !editingItem.subproducts) return {};
        return {};
    });

    // The chosen ID array for this step
    const popupID = popup.id;
    const currentSelections = selectedOptions[popupID] || [];

    // Handler: toggle or single-select
    function handleSubproductClick(sub: Subproduct) {
        const subID = sub.id;
        setSelectedOptions((prev) => {
            const oldArray = prev[popupID] || [];
            let newArray: string[] = [];

            if (multiselect) {
                if (oldArray.includes(subID)) {
                    newArray = oldArray.filter((id) => id !== subID);
                } else {
                    newArray = [...oldArray, subID];
                }
            } else {
                // single select
                newArray = [subID];
            }

            return {
                ...prev,
                [popupID]: newArray,
            };
        });
    }

    // Next/back/finish
    function handleNext() {
        if (currentIndex >= sortedPopups.length - 1) {
            handleFinish();
        } else {
            setCurrentIndex((i) => i + 1);
        }
    }
    function handleBack() {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }
    function handleFinish() {
        // Gather subproducts from all steps
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

        // If editing => update; else add
        const basePrice = product.price ?? 0;
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
        onClose();
    }

    // Outside click => close
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    // === NEW: build a "selectedItems" array to display on top ===
    const selectedItems = gatherAllSelectedItems(sortedPopups, selectedOptions);

    // === 6) Gather brand color or fallback
    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    return (
        <div
            className="
        fixed inset-0 z-50
        flex flex-col
        items-center
        justify-end md:justify-center
        bg-black bg-opacity-70
        transition-opacity duration-300
        animate-fadeIn
      "
            onClick={handleOverlayClick}
        >
            {/* White popup container */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="
          relative
          w-[100vw] md:w-[50vw]
          min-h-[70vh]
          max-h-[90vh] md:min-h-[50vh]
          bg-white
          rounded-t-2xl md:rounded-b-2xl
          shadow-lg
          overflow-auto
          animate-slideUp
        "
            >
                {/* Sticky Image Banner */}
                <div className="relative sticky top-0 z-10 w-full h-[150px] md:h-[200px]">
                    {product.image?.url && (
                        (() => {
                            const safeUrl = encodeURI(product.image.url);
                            return (
                                <div
                                    className="absolute inset-0 bg-cover bg-no-repeat bg-center opacity-90"
                                    style={{ backgroundImage: `url(${safeUrl})` }}
                                />
                            );
                        })()
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />

                    {/* Close Button + Title + Price */}
                    <div className="relative flex flex-col items-center justify-end h-full pb-4">
                        <button
                            onClick={onClose}
                            className="
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
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

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
                <div className="flex-1 w-[95%] mx-auto mb-14 mt-5">
                    {/* 1) Show the "selected items" row if any */}
                    {selectedItems.length > 0 && (
                        <div className="selected-items flex flex-row flex-wrap items-center gap-2 mb-6">
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="selected-item-tile animate-add flex items-center gap-1"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded-full">
                                        {item.image?.url ? (
                                            <img
                                                src={item.image.url}
                                                alt={item.image.alt || item.name_nl}
                                                className="object-cover w-full h-full rounded-full"
                                            />
                                        ) : (
                                            <span className="text-xs text-center px-2">
                                                {item.name_nl}
                                            </span>
                                        )}
                                    </div>
                                    {/* or label text next to it if you want */}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2) Step label */}
                    <h2 className="text-xl font-semibold mt-20 mb-10 text-center">
                        {popup_title_nl}
                    </h2>

                    {/* 3) Subproduct tile grid */}
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
                                    style={{
                                        borderRadius: "0.5rem",
                                        // If selected => dynamic border color = brandCTA
                                        borderLeftWidth: isSelected ? "4px" : "1px",
                                        borderLeftColor: isSelected ? brandCTA : "#d1d5db", // #d1d5db ~ border-gray-300
                                        borderStyle: "solid",
                                    }}
                                    className={`
                                    relative
                                    flex flex-col justify-between
                                    p-2 rounded-lg text-center cursor-pointer transition
                                    ${isSelected
                                            ? "bg-gray-100"
                                            : "border border-gray-300" // fallback for non-left sides
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

                                    {/* Checkmark if selected */}
                                    {isSelected && (
                                        <div className="absolute bottom-2 right-2" style={{ color: brandCTA }}>
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
                text-xl
              "
                        >
                            Terug
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleNext}
                        style={{
                            backgroundColor: brandCTA,
                            color: "#ffffff",
                        }}
                        className="
              px-4 py-2
              rounded-full
              transition
              text-xl
            "
                    >
                        {currentIndex < sortedPopups.length - 1 ? "Volgende" : "Bevestigen"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** A helper function to gather *all* selected subproducts across all popups. */
function gatherAllSelectedItems(
    sortedPopups: PopupItem[],
    selectedOptions: Record<string, string[]>
) {
    // We'll create an array of "sub" with { id, name_nl, image }, etc.
    // For sub.linkedProduct => use that data instead.
    const results: Array<{
        id: string;
        name_nl: string;
        image?: { url: string; alt?: string };
    }> = [];

    for (const popIt of sortedPopups) {
        if (!popIt.popup) continue;
        const chosenIDs = selectedOptions[popIt.popup.id] || [];
        for (const sub of popIt.popup.subproducts) {
            if (!chosenIDs.includes(sub.id)) continue;

            if (sub.linkedProduct) {
                results.push({
                    id: sub.linkedProduct.id,
                    name_nl: sub.linkedProduct.name_nl,
                    image: sub.linkedProduct.image || undefined,
                });
            } else {
                results.push({
                    id: sub.id,
                    name_nl: sub.name_nl,
                    image: sub.image || undefined,
                });
            }
        }
    }

    return results;
}
