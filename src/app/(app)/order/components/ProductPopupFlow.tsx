"use client";

import React, { useState, useEffect, MouseEvent } from "react";
import { useCart, CartItem } from "../../../../context/CartContext";
import { FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "@/context/TranslationsContext";
import { FiX } from "react-icons/fi";
import Image from "next/image";

/**
 * Minimal subproduct/link types
 */
type LinkedProductData = {
    id: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price: number | null;
    image?: { url: string; alt?: string } | null;
    tax?: number | null;
    tax_dinein?: number | null;

    /** Additional fields for status/stock, if desired: */
    status?: string;
    enable_stock?: boolean;
    quantity?: number;
};

/**
 * If you'd like to track subproduct-level stock & status:
 */
type Subproduct = {
    id: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price: number;
    image?: { url: string; alt?: string } | null;
    linkedProduct?: LinkedProductData;
    tax?: number | null;
    tax_dinein?: number | null;

    /** Additional fields if you want to filter out disabled or track out-of-stock, etc. */
    status?: string;
    stock_enabled?: boolean;
    stock_quantity?: number;
};

type PopupDoc = {
    id: string;
    popup_title_nl: string;
    popup_title_en?: string;
    popup_title_de?: string;
    popup_title_fr?: string;
    multiselect: boolean;
    subproducts: Subproduct[];

    minimum_option?: number;
    maximum_option?: number;
    allowMultipleTimes?: boolean;
};

type PopupItem = {
    order: number;
    popup: PopupDoc | null;
};

type Product = {
    id: string;
    name_nl: string;
    name_en?: string;
    name_de?: string;
    name_fr?: string;
    price?: number | null;
    image?: { url: string; alt: string };
    productpopups?: PopupItem[];
    tax?: number | null;
    tax_dinein?: number | null;
};

type Branding = {
    primaryColorCTA?: string;
    // ...
};

interface Props {
    product: Product;
    editingItem?: CartItem;
    editingItemSignature?: string;
    onClose: () => void;
    branding?: Branding;
    cartRef?: React.RefObject<HTMLDivElement | null>;
    lang?: string;
    isKiosk?: boolean;
}

/** Pick popup title depending on lang */
function pickPopupTitle(p: PopupDoc, lang?: string): string {
    switch (lang) {
        case "en":
            return p.popup_title_en ?? p.popup_title_nl;
        case "fr":
            return p.popup_title_fr ?? p.popup_title_nl;
        case "de":
            return p.popup_title_de ?? p.popup_title_nl;
        default:
            return p.popup_title_nl;
    }
}

/** Pick subproduct name in correct language */
function pickSubproductName(
    s: {
        name_nl: string;
        name_en?: string;
        name_de?: string;
        name_fr?: string;
    },
    lang?: string
): string {
    switch (lang) {
        case "en":
            return s.name_en ?? s.name_nl;
        case "fr":
            return s.name_fr ?? s.name_nl;
        case "de":
            return s.name_de ?? s.name_nl;
        default:
            return s.name_nl;
    }
}

/** Pick main product name in correct language */
function pickProductName(
    product: {
        name_nl: string;
        name_en?: string;
        name_de?: string;
        name_fr?: string;
    },
    lang?: string
): string {
    switch (lang) {
        case "en":
            return product.name_en ?? product.name_nl;
        case "fr":
            return product.name_fr ?? product.name_nl;
        case "de":
            return product.name_de ?? product.name_nl;
        default:
            return product.name_nl;
    }
}

/** Gather *all* selected subproducts across all popups. */
function gatherAllSelectedItems(
    sortedPopups: PopupItem[],
    selectedOptions: Record<string, string[]>,
    subproductQuantities: Record<string, Record<string, number>>
) {
    const results: Array<{
        id: string;
        name_nl: string;
        image?: { url: string; alt?: string };
        quantity: number;
    }> = [];

    for (const popIt of sortedPopups) {
        if (!popIt.popup) continue;

        const pId = popIt.popup.id;
        const { allowMultipleTimes } = popIt.popup;

        if (allowMultipleTimes) {
            const qtyMap = subproductQuantities[pId] || {};
            for (const sub of popIt.popup.subproducts) {
                const q = qtyMap[sub.id] || 0;
                if (q <= 0) continue;

                // Push once with quantity
                results.push({
                    id: sub.linkedProduct?.id ?? sub.id,
                    name_nl: sub.linkedProduct?.name_nl ?? sub.name_nl,
                    image: sub.linkedProduct?.image || sub.image || undefined,
                    quantity: q, // Attach quantity here
                });
            }
        } else {
            const chosenIDs = selectedOptions[pId] || [];
            for (const sub of popIt.popup.subproducts) {
                if (!chosenIDs.includes(sub.id)) continue;
                results.push({
                    id: sub.linkedProduct?.id ?? sub.id,
                    name_nl: sub.linkedProduct?.name_nl ?? sub.name_nl,
                    image: sub.linkedProduct?.image || sub.image || undefined,
                    quantity: 1, // Single selection implies quantity of 1
                });
            }
        }
    }
    return results;
}

export default function ProductPopupFlow({
    product,
    editingItem,
    editingItemSignature,
    onClose,
    branding,
    cartRef,
    lang,
    isKiosk = false,
}: Props) {
    const { t } = useTranslation();
    const { addItem, updateItem } = useCart();

    // 1) Sort popups by .order
    const sortedPopups = (product.productpopups || [])
        .filter((p) => p.popup !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // 2) If no popups => we can either return null or handle differently
    if (sortedPopups.length === 0) return null;

    // Step-based (wizard-like)
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentPopupItem = sortedPopups[currentIndex];
    if (!currentPopupItem?.popup) {
        return null;
    }

    const popup = currentPopupItem.popup;
    const popupTitle = pickPopupTitle(popup, lang);

    // 3) Filter out subproducts if they are *disabled*,
    //    but keep them if out-of-stock -> show a label
    const displayedSubproducts = popup.subproducts.filter((sub) => {
        // skip sub if explicitly disabled
        if (sub.status === "disabled") return false;

        // skip sub if linked product is disabled
        if (sub.linkedProduct && sub.linkedProduct.status === "disabled") {
            return false;
        }

        // We do NOT skip sub if it's out of stock. We'll show a label instead
        // So we return true
        return true;
    });

    // For "allowMultipleTimes" => store subproductQuantities
    const [subproductQuantities, setSubproductQuantities] = useState<
        Record<string, Record<string, number>>
    >({});

    // If you want to allow multiple selection => see if popup.multiselect
    // We'll store them in selectedOptions
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
        // If editing => we might prefill
        if (!editingItem || !editingItem.subproducts) return {};
        return {};
    });

    // Local error message
    const [errorMessage, setErrorMessage] = useState("");
    // Over-max highlight (optional)
    const [isOverMax, setIsOverMax] = useState(false);

    // Helper to sum up total picks in a popup (for max checking)
    function getTotalQuantityForPopup(popupId: string): number {
        const map = subproductQuantities[popupId] || {};
        return Object.values(map).reduce((acc, qty) => acc + qty, 0);
    }
    const totalSoFar = getTotalQuantityForPopup(popup.id);

    /** Increment quantity for a subproduct. If user is at max => block. */
    function incrementQty(popupId: string, subId: string) {
        if (popup.maximum_option && popup.maximum_option > 0 && totalSoFar >= popup.maximum_option) {
            setIsOverMax(true);
            setTimeout(() => setIsOverMax(false), 1000);
            return;
        }
        setSubproductQuantities((prev) => {
            const oldMap = prev[popupId] || {};
            const oldQty = oldMap[subId] || 0;
            return {
                ...prev,
                [popupId]: {
                    ...oldMap,
                    [subId]: oldQty + 1,
                },
            };
        });
    }

    /** Decrement quantity for a subproduct. */
    function decrementQty(popupId: string, subId: string) {
        setSubproductQuantities((prev) => {
            const oldMap = prev[popupId] || {};
            const oldQty = oldMap[subId] || 0;
            const newQty = Math.max(oldQty - 1, 0);
            return {
                ...prev,
                [popupId]: {
                    ...oldMap,
                    [subId]: newQty,
                },
            };
        });
    }

    /** Toggle or single-select for subproduct if not allowMultipleTimes. */
    function handleSubproductClick(sub: Subproduct) {
        setErrorMessage("");
        const subID = sub.id;

        setSelectedOptions((prev) => {
            const oldArray = prev[popup.id] || [];
            let newArray: string[] = [];

            if (popup.multiselect) {
                // multi-select toggle
                if (oldArray.includes(subID)) {
                    newArray = oldArray.filter((id) => id !== subID);
                } else {
                    newArray = [...oldArray, subID];
                }
            } else {
                // single select
                if (oldArray.includes(subID)) {
                    newArray = [];
                } else {
                    newArray = [subID];
                }
            }

            return {
                ...prev,
                [popup.id]: newArray,
            };
        });
    }

    /** Next/Back step navigation */
    function handleNext() {
        setErrorMessage("");
        // enforce min
        if (popup.minimum_option && popup.minimum_option > 0) {
            if (popup.allowMultipleTimes) {
                const totalQty = getTotalQuantityForPopup(popup.id);
                if (totalQty < popup.minimum_option) {
                    setErrorMessage(`Je moet minstens ${popup.minimum_option} optie(s) kiezen!`);
                    return;
                }
            } else {
                const chosenIDs = selectedOptions[popup.id] || [];
                if (chosenIDs.length < popup.minimum_option) {
                    setErrorMessage(`Je moet minstens ${popup.minimum_option} optie(s) kiezen!`);
                    return;
                }
            }
        }

        if (currentIndex >= sortedPopups.length - 1) {
            // final step => finish
            handleFinish();
        } else {
            setCurrentIndex((i) => i + 1);
        }
    }

    function handleBack() {
        setErrorMessage("");
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }

    /** Finalize => gather all subproducts from all popups + add or update cart */
    function handleFinish() {
        setErrorMessage("");
        // enforce min on last popup
        if (popup.minimum_option && popup.minimum_option > 0) {
            if (popup.allowMultipleTimes) {
                const totalQty = getTotalQuantityForPopup(popup.id);
                if (totalQty < popup.minimum_option) {
                    setErrorMessage(`Je moet minstens ${popup.minimum_option} optie(s) kiezen!`);
                    return;
                }
            } else {
                const chosenIDs = selectedOptions[popup.id] || [];
                if (chosenIDs.length < popup.minimum_option) {
                    setErrorMessage(`Je moet minstens ${popup.minimum_option} optie(s) kiezen!`);
                    return;
                }
            }
        }

        // Gather subproducts from *all* popups
        const chosenSubs: Array<{
            subproductId: string;
            name_nl: string;
            name_en?: string;
            name_de?: string;
            name_fr?: string;
            price: number;
            tax?: number;
            tax_dinein?: number;
            image?: { url: string; alt?: string };
            quantity: number;
        }> = [];

        for (const popIt of sortedPopups) {
            if (!popIt.popup) continue;
            const pId = popIt.popup.id;

            if (popIt.popup.allowMultipleTimes) {
                const qtyMap = subproductQuantities[pId] || {};
                for (const sp of popIt.popup.subproducts) {
                    const q = qtyMap[sp.id] || 0;
                    if (q > 0) {
                        const subData = {
                            subproductId: sp.linkedProduct?.id ?? sp.id,
                            name_nl: sp.linkedProduct?.name_nl ?? sp.name_nl,
                            name_en: sp.linkedProduct?.name_en ?? sp.name_en ?? sp.name_nl,
                            name_de: sp.linkedProduct?.name_de ?? sp.name_de ?? sp.name_nl,
                            name_fr: sp.linkedProduct?.name_fr ?? sp.name_fr ?? sp.name_nl,
                            price: sp.linkedProduct?.price ?? sp.price ?? 0,
                            tax:
                                typeof sp.linkedProduct?.tax === "number"
                                    ? sp.linkedProduct!.tax
                                    : sp.tax ?? undefined,
                            tax_dinein:
                                typeof sp.linkedProduct?.tax_dinein === "number"
                                    ? sp.linkedProduct!.tax_dinein
                                    : sp.tax_dinein ?? undefined,
                            image:
                                sp.linkedProduct?.image ?? sp.image
                                    ? {
                                        url: (sp.linkedProduct?.image ?? sp.image)?.url ?? "",
                                        alt: (sp.linkedProduct?.image ?? sp.image)?.alt ?? sp.name_nl,
                                    }
                                    : undefined,
                            quantity: q,
                        };
                        chosenSubs.push(subData);
                    }
                }
            } else {
                // multi/single => selectedOptions
                const chosenIDs = selectedOptions[pId] || [];
                for (const sp of popIt.popup.subproducts) {
                    if (!chosenIDs.includes(sp.id)) continue;
                    chosenSubs.push({
                        subproductId: sp.linkedProduct?.id ?? sp.id,
                        name_nl: sp.linkedProduct?.name_nl ?? sp.name_nl,
                        name_en: sp.linkedProduct?.name_en ?? sp.name_en ?? sp.name_nl,
                        name_de: sp.linkedProduct?.name_de ?? sp.name_de ?? sp.name_nl,
                        name_fr: sp.linkedProduct?.name_fr ?? sp.name_fr ?? sp.name_nl,
                        price: sp.linkedProduct?.price ?? sp.price,
                        tax:
                            typeof sp.linkedProduct?.tax === "number"
                                ? sp.linkedProduct!.tax
                                : sp.tax ?? undefined,
                        tax_dinein:
                            typeof sp.linkedProduct?.tax_dinein === "number"
                                ? sp.linkedProduct!.tax_dinein
                                : sp.tax_dinein ?? undefined,
                        image:
                            sp.linkedProduct?.image ?? sp.image
                                ? {
                                    url: (sp.linkedProduct?.image ?? sp.image)?.url ?? "",
                                    alt: (sp.linkedProduct?.image ?? sp.image)?.alt ?? sp.name_nl,
                                }
                                : undefined,
                        quantity: 1,
                    });
                }
            }
        }

        const basePrice = product.price ?? 0;
        const mainTax = product.tax ?? 0;
        const mainTaxDinein = product.tax_dinein ?? 0;

        if (editingItem && editingItemSignature) {
            updateItem(editingItemSignature, {
                price: basePrice,
                taxRate: mainTax,
                taxRateDineIn: mainTaxDinein,
                subproducts: chosenSubs,
                hasPopups: true,
            });
        } else {
            addItem({
                productId: product.id,
                productName: pickProductName(product, lang),
                productNameNL: product.name_nl,
                productNameEN: product.name_en ?? product.name_nl,
                productNameDE: product.name_de ?? product.name_nl,
                productNameFR: product.name_fr ?? product.name_nl,
                price: basePrice,
                taxRate: mainTax,
                taxRateDineIn: mainTaxDinein,
                quantity: 1,
                image: product.image
                    ? {
                        url: product.image.url,
                        alt: product.image.alt ?? product.name_nl,
                    }
                    : undefined,
                note: "",
                subproducts: chosenSubs,
                hasPopups: true,
            });

            window.dispatchEvent(
                new CustomEvent("product-added", {
                    detail: {
                        productId: product.id,
                        imageUrl: product.image?.url || "",
                    },
                })
            );
        }

        onClose();
    }

    /** Close modal when user clicks overlay */
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    // brandCTA color
    const brandCTA = branding?.primaryColorCTA || "#068b59";

    // Gather selected items from all steps for top row preview
    const selectedItems = gatherAllSelectedItems(sortedPopups, selectedOptions, subproductQuantities);

    return (
        <div
            className={`
        fixed inset-0 z-50
        flex flex-col
        items-center
        justify-end md:justify-center
        bg-black bg-opacity-70
        transition-opacity duration-300
        animate-fadeIn
        ${isKiosk ? "p-2" : ""}
      `}
            onClick={handleOverlayClick}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`
          relative
          ${isKiosk
                        ? "w-[100vw] min-h-[90vh] max-h-[99vh] mt-auto"
                        : "w-[100vw] md:w-[70vw] min-h-[40vh] max-h-[90vh] md:min-h-[20vh]"
                    }
          bg-white
          rounded-t-2xl md:rounded-b-2xl
          shadow-lg
          overflow-auto
          animate-slideUp
          ${isKiosk ? "p-0" : ""}
        `}
            >
                {/* Sticky Banner */}
                <div
                    className={`
            relative sticky top-0 z-10 w-full
            ${isKiosk
                            ? "h-[180px] md:h-[340px] mb-10"
                            : "h-[150px] md:h-[200px]"
                        }
          `}
                >
                    {product.image?.url && (() => {
                        const safeUrl = encodeURI(product.image.url);
                        return (
                            <div
                                className="absolute inset-0 bg-cover bg-no-repeat bg-center opacity-90"
                                style={{ backgroundImage: `url(${safeUrl})` }}
                            />
                        );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />

                    {/* Close Button + Title + Price */}
                    <div className="relative flex flex-col items-center justify-end h-full pb-4">
                        <button
                            onClick={onClose}
                            title="Close Modal"
                            className="
                absolute
                top-4 right-4
                bg-red-500 text-white
                rounded-xl
                shadow-xl
                p-3
                hover:bg-red-600
                transition-colors
                z-50
              "
                            style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                            <FiX className="w-6 h-6" />
                        </button>

                        <div className="text-center text-white flex gap-2">
                            <h1
                                className={`
                  font-semibold
                  ${isKiosk ? "text-2xl" : "text-xl"}
                `}
                            >
                                {pickProductName(product, lang)}
                            </h1>
                            {typeof product.price === "number" && (
                                <span className={isKiosk ? "text-2xl" : "text-xl"}>
                                    €{product.price.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div
                    className={`${isKiosk ? "mb-24 mt-36 px-4" : "mb-14 mt-5"} w-[95%] mx-auto`}
                >
                    {/* The selected-items row */}
                    {selectedItems.length > 0 && (
                        <div
                            className={`flex flex-row flex-wrap items-center gap-2 mb-6 ${isKiosk ? "justify-center" : ""
                                }`}
                        >
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="selected-item-tile animate-add flex items-center gap-1 relative"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded-full">
                                        {item.image?.url ? (
                                            <Image
                                                src={item.image.url}
                                                alt={item.image.alt || item.name_nl}
                                                className="object-cover w-full h-full rounded-full"
                                                width={80}
                                                height={80}
                                            />
                                        ) : (
                                            <span className="text-xs text-center px-2">{item.name_nl}</span>
                                        )}
                                    </div>
                                    {item.quantity > 1 && (
                                        <span className="font-bold text-lg absolute top-0 right-0 bg-white rounded-full px-2">
                                            x{item.quantity}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Popup Title */}
                    <h2
                        className={`
              font-semibold text-center
              ${isKiosk ? "text-2xl mb-8 mt-10" : "text-xl mt-20 mb-10"}
            `}
                    >
                        {popupTitle}
                        {popup.maximum_option && popup.maximum_option > 0 && (
                            <span
                                style={{
                                    fontSize: isKiosk ? "1.25rem" : "1rem",
                                    marginLeft: "0.5rem",
                                    color: isOverMax ? "red" : "inherit",
                                    transform: isOverMax ? "scale(1.1)" : "none",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                (max {popup.maximum_option})
                            </span>
                        )}
                    </h2>

                    {/* If we have an error => display in red */}
                    {errorMessage && (
                        <div className="text-red-700 text-xl font-bold mb-4 text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* Subproduct tile grid */}
                    <div
                        className={`
              mt-4
              grid gap-4
              ${isKiosk ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3"}
            `}
                    >
                        {displayedSubproducts.map((sub) => {
                            const useLinked = !!sub.linkedProduct;
                            const displayName = useLinked
                                ? pickSubproductName(sub.linkedProduct!, lang)
                                : pickSubproductName(sub, lang);
                            const displayPrice = useLinked
                                ? (sub.linkedProduct?.price ?? 0)
                                : (sub.price ?? 0)
                            const displayImage = useLinked
                                ? sub.linkedProduct?.image
                                : sub.image;

                            // Check out-of-stock
                            // If sub has stock tracking and quantity=0 => out of stock
                            // Or if linked product is out of stock
                            const isOutOfStock =
                                (sub.stock_enabled && sub.stock_quantity === 0) ||
                                (sub.linkedProduct?.enable_stock && (sub.linkedProduct?.quantity || 0) === 0);

                            const chosenThisStep = selectedOptions[popup.id] || [];
                            const isSelected = chosenThisStep.includes(sub.id);

                            const qtyMap = subproductQuantities[popup.id] || {};
                            const subQty = qtyMap[sub.id] || 0;

                            // If allowMultipleTimes => clicking card increments
                            const handleClickCard = () => {
                                if (isOutOfStock) {
                                    // do nothing, sub is out of stock
                                    return;
                                }

                                if (popup.allowMultipleTimes) {
                                    incrementQty(popup.id, sub.id);
                                } else {
                                    handleSubproductClick(sub);
                                }
                            };

                            return (
                                <div
                                    key={sub.id}
                                    onClick={handleClickCard}
                                    style={{
                                        borderRadius: "0.5rem",
                                        borderLeftWidth: isSelected ? "4px" : "1px",
                                        borderLeftColor: isSelected
                                            ? branding?.primaryColorCTA || "#068b59"
                                            : "#d1d5db",
                                        borderStyle: "solid",
                                        // If out of stock => reduce opacity or show different style
                                        opacity: isOutOfStock ? 0.6 : 1,
                                        cursor: isOutOfStock ? "not-allowed" : "pointer",
                                    }}
                                    className={`
                    relative
                    flex flex-col justify-between
                    p-2 rounded-lg text-center transition
                    ${isSelected ? "bg-gray-100" : "border border-gray-300"}
                  `}
                                >
                                    <div className="flex-grow flex items-center justify-center mb-4">
                                        {displayImage?.url && (
                                            <Image
                                                src={displayImage.url}
                                                alt={displayImage.alt || displayName}
                                                width={isKiosk ? 80 : 60}
                                                height={isKiosk ? 80 : 60}
                                                className="object-contain"
                                            />
                                        )}
                                    </div>

                                    {popup.allowMultipleTimes ? (
                                        // Show quantity increment UI
                                        <div className="flex flex-col items-center">
                                            <span
                                                className={`
                          text-gray-700 font-bold text-center
                          ${isKiosk ? "text-lg" : "text-md"}
                        `}
                                            >
                                                {displayName}
                                            </span>
                                            <span
                                                className={`
                          text-gray-500 font-bold
                          ${isKiosk ? "text-md" : "text-sm"}
                        `}
                                            >
                                                {displayPrice > 0
                                                    ? `(+ €${displayPrice.toFixed(2)})`
                                                    : `€${displayPrice.toFixed(2)}`}
                                            </span>

                                            {/* If out of stock => show label */}
                                            {isOutOfStock ? (
                                                <span className="text-red-700 font-semibold mt-2">
                                                    {t("out_of_stock") || "Out of Stock"}
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            decrementQty(popup.id, sub.id);
                                                        }}
                                                        style={{ backgroundColor: brandCTA }}
                                                        className="
                              text-white
                              px-3 py-1
                              rounded-full
                              font-bold
                              text-lg
                            "
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-semibold min-w-[24px] text-lg">
                                                        {subQty}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            incrementQty(popup.id, sub.id);
                                                        }}
                                                        style={{ backgroundColor: brandCTA }}
                                                        className="
                              text-white
                              px-3 py-1
                              rounded-full
                              font-bold
                              text-lg
                            "
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Single or multi-select toggle
                                        <div className="flex flex-col items-center">
                                            <span
                                                className={`
                          text-gray-700 font-bold text-center
                          ${isKiosk ? "text-lg" : "text-md"}
                        `}
                                            >
                                                {displayName}
                                            </span>
                                            <span
                                                className={`
                          text-gray-500 font-bold
                          ${isKiosk ? "text-md" : "text-sm"}
                        `}
                                            >
                                                {displayPrice > 0
                                                    ? `(+ €${displayPrice.toFixed(2)})`
                                                    : `€${displayPrice.toFixed(2)}`}
                                            </span>

                                            {/* If out of stock => show label */}
                                            {isOutOfStock ? (
                                                <span className="text-red-700 font-semibold mt-2">
                                                    {t("out_of_stock") || "Out of Stock"}
                                                </span>
                                            ) : (
                                                <>
                                                    {/* Checkmark if selected */}
                                                    {isSelected && (
                                                        <div
                                                            className="absolute bottom-2 right-2"
                                                            style={{ color: brandCTA }}
                                                        >
                                                            <FiCheckCircle size={isKiosk ? 28 : 24} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom sticky Next/Back bar */}
                <div
                    className={`
            sticky bottom-0 w-full
            bg-white bg-opacity-90
            z-50 p-4
            flex items-center justify-between
            ${isKiosk ? "min-h-[80px]" : ""}
          `}
                >
                    {currentIndex > 0 ? (
                        <button
                            onClick={handleBack}
                            className={`
                bg-gray-500 text-white
                rounded-full
                hover:bg-gray-600
                transition
                ${isKiosk ? "text-2xl px-6 py-3" : "text-xl px-4 py-2"}
              `}
                        >
                            {t("order.popup.back")}
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleNext}
                        style={{ backgroundColor: brandCTA, color: "#ffffff" }}
                        className={`
              rounded-full
              transition
              ${isKiosk ? "text-2xl px-6 py-3" : "text-xl px-4 py-2"}
            `}
                    >
                        {currentIndex < sortedPopups.length - 1
                            ? t("order.popup.next")
                            : t("order.popup.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}
