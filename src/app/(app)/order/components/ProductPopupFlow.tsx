"use client";

import React, { useState, useEffect, MouseEvent } from "react";
import { useCart, CartItem } from "../../../../context/CartContext";
import { FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "@/context/TranslationsContext";
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
};

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
};

/**
 * Extend your PopupDoc to include optional minimum_option, maximum_option, etc.
 * or whichever fields you actually use.
 */
type PopupDoc = {
    id: string;
    popup_title_nl: string;
    popup_title_en?: string;
    popup_title_de?: string;
    popup_title_fr?: string;
    multiselect: boolean;
    subproducts: Subproduct[];

    /** If you want to require at least N selections. Make it optional. */
    minimum_option?: number;
    /** If you also want a maximum_option, do it similarly. */
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
    s: { name_nl: string; name_en?: string; name_de?: string; name_fr?: string },
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
    product: { name_nl: string; name_en?: string; name_de?: string; name_fr?: string },
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

/** Animate a cloned <img> from the popup to the cart. (unused by default) */
function flyToCart(
    cartRef: React.RefObject<HTMLDivElement>,
    sourceImg: HTMLImageElement | null
) {
    if (!cartRef.current || !sourceImg) return;

    const flyingImg = sourceImg.cloneNode(true) as HTMLImageElement;
    flyingImg.style.position = "absolute";
    flyingImg.style.zIndex = "9999";

    const rect = sourceImg.getBoundingClientRect();
    const scrollX = window.scrollX || 0;
    const scrollY = window.scrollY || 0;

    flyingImg.style.width = `${rect.width}px`;
    flyingImg.style.height = `${rect.height}px`;
    flyingImg.style.left = `${rect.left + scrollX}px`;
    flyingImg.style.top = `${rect.top + scrollY}px`;
    flyingImg.style.transition = "transform 1s ease-in-out, opacity 1s ease-in-out";
    document.body.appendChild(flyingImg);

    const cartIcon = cartRef.current.querySelector(".cart-icon") as HTMLElement | null;
    const cartRect = cartIcon
        ? cartIcon.getBoundingClientRect()
        : cartRef.current.getBoundingClientRect();

    requestAnimationFrame(() => {
        const flyingRect = flyingImg.getBoundingClientRect();
        const deltaX =
            cartRect.left + cartRect.width / 2 - (flyingRect.left + flyingRect.width / 2);
        const deltaY =
            cartRect.top + cartRect.height / 2 - (flyingRect.top + flyingRect.height / 2);

        flyingImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
        flyingImg.style.opacity = "0.3";
    });

    setTimeout(() => {
        flyingImg.remove();
    }, 1200);
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

    // Sort + filter
    const sortedPopups = (product.productpopups || [])
        .filter((p) => p.popup !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sortedPopups.length === 0) return null;

    // Step-based
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentPopupItem = sortedPopups[currentIndex];

    // If, for some reason, currentPopupItem.popup is null, we can bail out
    if (!currentPopupItem?.popup) {
        // Could also return null or handle differently
        return null;
    }
    const popup = currentPopupItem.popup;
    const popupTitle = pickPopupTitle(popup, lang);
    const { multiselect, subproducts } = popup;

    // If you have a "minimum_option" or "maximum_option" in popup
    // that requires certain picks:
    // popup.minimum_option => number | undefined
    // popup.maximum_option => number | undefined

    // Our selected items
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
        // If editing => we might prefill
        if (!editingItem || !editingItem.subproducts) return {};
        return {};
    });

    const popupID = popup.id;
    const currentSelections = selectedOptions[popupID] || [];

    // New: local error message
    const [errorMessage, setErrorMessage] = useState("");

    const [subproductQuantities, setSubproductQuantities] = useState<Record<string, Record<string, number>>>({})


    function incrementQty(popupId: string, subId: string) {
        setErrorMessage(""); // clear any old error first

        // 1) Calculate the total selected (across all subproducts) so far
        const totalSoFar = getTotalQuantityForPopup(popupId)

        // 2) If we've reached max, block
        if (popup.maximum_option && popup.maximum_option > 0) {
            if (totalSoFar >= popup.maximum_option) {
                setErrorMessage(`Cannot exceed the maximum of ${popup.maximum_option} total picks.`)
                return
            }
        }

        setSubproductQuantities(prev => {
            const oldMap = prev[popupId] || {}
            const oldQty = oldMap[subId] || 0
            return {
                ...prev,
                [popupId]: {
                    ...oldMap,
                    [subId]: oldQty + 1
                }
            }
        })
    }

    /** A helper function to sum up the total picks for a single popup ID. */
    function getTotalQuantityForPopup(popupId: string): number {
        const map = subproductQuantities[popupId] || {}
        return Object.values(map).reduce((acc, qty) => acc + qty, 0)
    }

    function decrementQty(popupId: string, subId: string) {
        setSubproductQuantities(prev => {
            const oldMap = prev[popupId] || {}
            const oldQty = oldMap[subId] || 0
            const newQty = Math.max(oldQty - 1, 0)
            return {
                ...prev,
                [popupId]: {
                    ...oldMap,
                    [subId]: newQty
                }
            }
        })
    }

    /** Toggle or single-select for subproduct. */
    function handleSubproductClick(sub: Subproduct) {
        setErrorMessage(""); // clear previous errors
        const subID = sub.id;
        setSelectedOptions((prev) => {
            const oldArray = prev[popupID] || [];
            let newArray: string[] = [];

            if (multiselect) {
                // If user tries to add subID but the oldArray is already at max
                if (
                    popup.maximum_option &&
                    popup.maximum_option > 0 &&
                    !oldArray.includes(subID) && // we're trying to add a new item
                    oldArray.length >= popup.maximum_option
                ) {
                    setErrorMessage(`Cannot exceed the maximum of ${popup.maximum_option} picks.`)
                    return prev; // do not change anything
                }
                // multi-select toggle
                if (oldArray.includes(subID)) {
                    newArray = oldArray.filter((id) => id !== subID);
                } else {
                    newArray = [...oldArray, subID];
                }
            } else {
                // single select:
                if (oldArray.includes(subID)) {
                    // if already selected => uncheck
                    newArray = [];
                } else {
                    // otherwise select
                    newArray = [subID];
                }
            }

            return {
                ...prev,
                [popupID]: newArray,
            };
        });
    }


    /** Move forward or finish. */
    function handleNext() {
        setErrorMessage(""); // reset
        // If popup has minimum_option => enforce it
        if (popup.minimum_option && popup.minimum_option > 0) {
            const chosenIDs = selectedOptions[popup.id] || [];
            if (chosenIDs.length < popup.minimum_option) {
                // Instead of alert, store an error
                setErrorMessage(
                    `Je moet minstens ${popup.minimum_option} optie(s) kiezen!`
                );
                return;
            }
        }

        // If final step => finish
        if (currentIndex >= sortedPopups.length - 1) {
            handleFinish();
        } else {
            setCurrentIndex((i) => i + 1);
        }
    }

    function handleBack() {
        setErrorMessage("");
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }

    function handleFinish() {
        setErrorMessage("");

        // 1) Final check on minimum_option for the *current* (last) popup
        if (popup.minimum_option && popup.minimum_option > 0) {
            const chosenIDs = selectedOptions[popup.id] || [];
            if (chosenIDs.length < popup.minimum_option) {
                setErrorMessage(`Je moet minstens ${popup.minimum_option} optie(s) kiezen!`);
                return;
            }
        }

        // 2) Gather subproducts from *all* popups into chosenSubs
        //    We'll do it by checking `selectedOptions[pId]` for each popup
        const chosenSubs: Array<{
            subproductId: string;
            name_nl: string;
            name_en?: string;
            name_de?: string;
            name_fr?: string;
            price: number;
            tax?: number;
            tax_dinein?: number;
            image?: {
                url: string;
                alt?: string;
            };
            quantity: number;
        }> = [];

        // For each subproduct in this popup
        for (const popIt of sortedPopups) {
            if (!popIt.popup) continue;
            const pId = popIt.popup.id;

            // if allowMultipleTimes => read from subproductQuantities
            if (popIt.popup.allowMultipleTimes) {
                const qtyMap = subproductQuantities[pId] || {};
                for (const sp of popIt.popup.subproducts) {
                    const q = qtyMap[sp.id] || 0;
                    if (q > 0) {
                        // push just ONE object, but with quantity: q
                        const subproductData = {
                            // same logic you had before:
                            subproductId: sp.linkedProduct?.id ?? sp.id,
                            name_nl: sp.linkedProduct?.name_nl ?? sp.name_nl,
                            name_en: sp.linkedProduct?.name_en ?? sp.name_en ?? sp.name_nl,
                            name_de: sp.linkedProduct?.name_de ?? sp.name_de ?? sp.name_nl,
                            name_fr: sp.linkedProduct?.name_fr ?? sp.name_fr ?? sp.name_nl,
                            price: sp.linkedProduct?.price ?? sp.price,
                            tax: typeof sp.linkedProduct?.tax === "number" ? sp.linkedProduct!.tax : sp.tax ?? undefined,
                            tax_dinein: typeof sp.linkedProduct?.tax_dinein === "number"
                                ? sp.linkedProduct!.tax_dinein
                                : sp.tax_dinein ?? undefined,
                            image: sp.linkedProduct?.image ?? sp.image
                                ? {
                                    url: (sp.linkedProduct?.image ?? sp.image)?.url ?? "",
                                    alt: (sp.linkedProduct?.image ?? sp.image)?.alt ?? sp.name_nl,
                                }
                                : undefined,
                            quantity: q,  // <--- store how many times user chose it
                        };
                        chosenSubs.push(subproductData);
                    }
                }
            } else {
                // multi-select or single-select => your existing chosenIDs approach
                const chosenIDs = selectedOptions[pId] || [];
                for (const sp of popIt.popup.subproducts) {
                    if (!chosenIDs.includes(sp.id)) continue;
                    // push one with quantity = 1
                    chosenSubs.push({
                        subproductId: sp.linkedProduct?.id ?? sp.id,
                        name_nl: sp.name_nl,
                        name_en: sp.name_en ?? sp.name_nl,
                        name_de: sp.name_de ?? sp.name_nl,
                        name_fr: sp.name_fr ?? sp.name_nl,

                        // Use sp.price
                        price: sp.price,

                        // If sp.tax or sp.tax_dinein exist, store them. Otherwise default to null or 0:
                        tax: typeof sp.tax === "number" ? sp.tax : undefined,
                        tax_dinein: typeof sp.tax_dinein === "number" ? sp.tax_dinein : undefined,


                        image: sp.image
                            ? {
                                url: sp.image.url,
                                alt: sp.image.alt ?? sp.name_nl,
                            }
                            : undefined,
                        quantity: 1,
                    });
                }
            }
        }

        // 3) Define the basePrice and main product tax fields
        const basePrice = product.price ?? 0
        const mainTax = product.tax ?? 0
        const mainTaxDinein = product.tax_dinein ?? 0

        // 4) Add or update in cart
        if (editingItem && editingItemSignature) {
            updateItem(editingItemSignature, {
                price: basePrice,
                taxRate: mainTax,        // for example: store top-level product tax
                taxRateDineIn: mainTaxDinein,
                subproducts: chosenSubs,
                hasPopups: true,
            })
        } else {
            addItem({
                productId: product.id,
                productName: pickProductName(product, lang),
                productNameNL: product.name_nl,
                productNameEN: product.name_en ?? product.name_nl,
                productNameDE: product.name_de ?? product.name_nl,
                productNameFR: product.name_fr ?? product.name_nl,
                price: basePrice,
                taxRate: mainTax,         // for example: store top-level product tax
                taxRateDineIn: mainTaxDinein,
                quantity: 1,
                image: product.image
                    ? {
                        url: product.image.url,
                        alt: product.image.alt ?? product.name_nl,
                    }
                    : undefined,
                note: "",
                subproducts: chosenSubs, // The final array of subproducts
                hasPopups: true,
            })

            // Optionally dispatch a "product-added" event for a cart animation or similar
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

    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    /** Gather selected items from all steps for top row preview */
    const selectedItems = gatherAllSelectedItems(
        sortedPopups,
        selectedOptions,
        subproductQuantities
    );

    const brandCTA = branding?.primaryColorCTA || "#068b59";

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
                {product.image?.url && (
                    <img
                        src={encodeURI(product.image.url)}
                        alt={product.image.alt || product.name_nl}
                        className="popup-fly-img"
                        style={{
                            visibility: "hidden",
                            width: 0,
                            height: 0,
                            position: "absolute",
                        }}
                    />
                )}

                {/* Sticky Image Banner */}
                <div
                    className={`
            relative sticky top-0 z-10 w-full
            ${isKiosk ? "h-[180px] md:h-[340px] mb-10" : "h-[150px] md:h-[200px]"}
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

                {/* Main content area */}
                <div className={`${isKiosk ? "mb-24 mt-36 px-4" : "mb-14 mt-5"} w-[95%] mx-auto`}>
                    {/* The selected-items row if any */}
                    {selectedItems.length > 0 && (
                        <div className={`flex flex-row flex-wrap items-center gap-2 mb-6 ${isKiosk ? "justify-center" : ""}`}>
                            {selectedItems.map((item) => (
                                <div key={item.id} className="selected-item-tile animate-add flex items-center gap-1 relative">
                                    <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded-full">
                                        {item.image?.url ? (
                                            <img src={item.image.url} alt={item.image.alt || item.name_nl} className="object-cover w-full h-full rounded-full" />
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


                    {/* 2) Step label => use popupTitle */}
                    <h2
                        className={`
              font-semibold text-center
              ${isKiosk ? "text-2xl mb-8 mt-10" : "text-xl mt-20 mb-10"}
            `}
                    >
                        {popupTitle}
                        {popup.maximum_option && popup.maximum_option > 0 && (
                            <span style={{ fontSize: isKiosk ? "1.25rem" : "1rem", marginLeft: "0.5rem" }}>
                                {`(max ${popup.maximum_option})`}
                            </span>
                        )}
                    </h2>

                    {/* If we have an error => display in red */}
                    {errorMessage && (
                        <div className="text-red-700 text-xl font-bold mb-4 text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* 3) Subproduct tile grid */}
                    <div
                        className={`
              mt-4
              grid gap-4
              ${isKiosk ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3"}
            `}
                    >
                        {subproducts.map((sub) => {
                            console.log(popup.allowMultipleTimes)
                            const useLinked = !!sub.linkedProduct
                            const displayName = useLinked
                                ? pickSubproductName(sub.linkedProduct!, lang)
                                : pickSubproductName(sub, lang)
                            const displayPrice = useLinked ? sub.linkedProduct!.price ?? 0 : sub.price
                            const displayImage = useLinked ? sub.linkedProduct?.image : sub.image

                            const chosenThisStep = selectedOptions[popupID] || []
                            const isSelected = chosenThisStep.includes(sub.id)

                            // For multiple times:
                            const qtyMap = subproductQuantities[popupID] || {}
                            const subQty = qtyMap[sub.id] || 0

                            // If allowMultipleTimes is true, we'll handle plus/minus clicks differently
                            const handleClickCard = () => {
                                // If multi-times is false, we still allow the entire card to toggle
                                if (!popup.allowMultipleTimes) {
                                    handleSubproductClick(sub)
                                }
                            }

                            return (
                                <div
                                    key={sub.id}
                                    onClick={handleClickCard} // see above
                                    style={{
                                        borderRadius: "0.5rem",
                                        borderLeftWidth: isSelected ? "4px" : "1px",
                                        borderLeftColor: isSelected ? brandCTA : "#d1d5db",
                                        borderStyle: "solid",
                                    }}
                                    className={`
        relative
        flex flex-col justify-between
        p-2 rounded-lg text-center cursor-pointer transition
        ${isSelected ? "bg-gray-100" : "border border-gray-300"}
      `}
                                >
                                    {/* Possibly an image */}
                                    <div className="flex-grow flex items-center justify-center mb-4">
                                        {displayImage?.url && (
                                            <img
                                                src={displayImage.url}
                                                alt={displayImage.alt || displayName}
                                                className={
                                                    isKiosk
                                                        ? "w-auto max-h-[80px]"
                                                        : "w-auto max-h-[60px]"
                                                }
                                            />
                                        )}
                                    </div>

                                    {/* Conditionally render plus/minus vs. single-click UI */}
                                    {popup.allowMultipleTimes ? (
                                        // allowMultipleTimes = true => plus/minus
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

                                            {/* Quantity controls */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        decrementQty(popupID, sub.id)
                                                    }}
                                                    className="bg-gray-200 px-3 py-1 rounded-md font-bold text-lg"
                                                >
                                                    -
                                                </button>
                                                <span className="font-semibold min-w-[24px] text-lg">{subQty}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        incrementQty(popupID, sub.id)
                                                    }}
                                                    className="bg-gray-200 px-3 py-1 rounded-md font-bold text-lg"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // allowMultipleTimes = false => single-click toggle UI
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

                                            {/* Checkmark if selected */}
                                            {isSelected && (
                                                <div
                                                    className="absolute bottom-2 right-2"
                                                    style={{ color: brandCTA }}
                                                >
                                                    <FiCheckCircle size={isKiosk ? 28 : 24} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Bottom sticky Next/Back */}
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
                        {currentIndex < sortedPopups.length - 1 ? t("order.popup.next") : t("order.popup.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Gather *all* selected subproducts across all popups. */
function gatherAllSelectedItems(
    sortedPopups: PopupItem[],
    selectedOptions: Record<string, string[]>,
    subproductQuantities: Record<string, Record<string, number>>,
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