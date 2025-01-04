"use client";

import React, { useState } from "react";

/** Minimal shape for what the card displays. */
type ProductCardProps = {
    id: string;
    displayName: string;
    displayDesc?: string;
    price: number | null;
    image?: { url: string; alt?: string };
    isPromotion?: boolean;
    old_price: number | null;
};

type Branding = {
    /** e.g. "#ECAA02" or some other brand color */
    primaryColorCTA?: string;
    // ...
};

interface Props {
    product: ProductCardProps;
    /**
     * If `shouldShowSpinner` is true, we run the local spinner animation
     * after `handleAction` is called. If false, no spinner shown.
     */
    shouldShowSpinner?: boolean;
    branding?: Branding;

    /**
     * The single callback from the parent that decides:
     * - if no popups => do an add-to-cart
     * - if has popups => open the popup
     */
    handleAction?: (prod: ProductCardProps) => void;
}

/**
 * ProductCard that has an optional spinner animation
 * if `shouldShowSpinner` is true.
 */
export default function ProductCard({
    product,
    shouldShowSpinner = false,
    handleAction,
    branding,
}: Props) {
    // Local spinner state if we want to show it
    const [loadingState, setLoadingState] = useState<"idle" | "loading" | "check">("idle");

    // We’ll track hover state for the plus button,
    // so we can show a custom border color on hover.
    const [hoverPlus, setHoverPlus] = useState(false);

    /**
     * Trigger local spinner: set to "loading", then "check", then revert to "idle".
     */
    function runLocalSpinner() {
        setLoadingState("loading");
        setTimeout(() => {
            setLoadingState("check");
            setTimeout(() => {
                setLoadingState("idle");
            }, 1000);
        }, 1000);
    }

    /**
     * Called when entire card is clicked.
     */
    function handleCardClick() {
        if (!handleAction) return;

        // Parent does either "add to cart" or "open popup"
        handleAction(product);

        // If we want local spinner => run it
        if (shouldShowSpinner) {
            runLocalSpinner();
        }
    }

    /**
     * Called when plus button is clicked. We skip the card-click.
     */
    function handlePlusClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (!handleAction) return;

        handleAction(product);
        if (shouldShowSpinner) {
            runLocalSpinner();
        }
    }

    // 1) Gather brand color or fallback
    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    // 2) Inline style for the plus button's border color on hover
    const plusButtonBorder = hoverPlus ? brandCTA : "transparent";

    // Render
    return (
        <div
            onClick={handleCardClick}
            style={{ borderRadius: "0.5rem" }}
            className={`
        relative
        border border-gray-300
        rounded-lg
        overflow-hidden
        shadow-lg
        flex
        bg-white
        cursor-pointer
        hover:shadow-xl
        transition-shadow
        w-full
        max-h-[200px]
      `}
        >
            {/* Promotion badge */}
            {product.isPromotion && (
                <div
                    className="absolute top-0 left-0 text-white text-md font-semibold px-2 py-1 rounded z-20"
                    style={{ backgroundColor: brandCTA || 'red' }} // fallback to "red" if no brand color
                >
                    Promotion
                </div>
            )}

            {/* Left: image area */}
            <div className="w-2/5 h-full flex items-center justify-center bg-gray-50">
                {product.image?.url ? (
                    <img
                        src={product.image.url}
                        alt={product.image.alt || product.displayName}
                        className="w-full h-full object-cover mix-blend-multiply"
                    />
                ) : (
                    <div className="text-gray-300 text-md p-4">No Image</div>
                )}
            </div>

            {/* Right: Title, Desc, Price */}
            <div className="w-3/5 p-4 flex flex-col justify-between relative">
                {/* Title / Desc */}
                <div>
                    <h2 className="text-lg font-bold mb-1 line-clamp-2">
                        {product.displayName}
                    </h2>
                    {product.displayDesc && (
                        <p className="text-md text-gray-600 line-clamp-3 mb-2">
                            {product.displayDesc}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div className="mt-2">
                    {typeof product.price === "number" ? (
                        <>
                            {/* If the product is on promotion and has an old_price => show strikethrough old_price */}
                            {product.isPromotion && product.old_price && (
                                <span className="text-sm text-gray-500 line-through mr-2">
                                    €{product.old_price.toFixed(2)}
                                </span>
                            )}
                            {/* Actual (current) price */}
                            <span className="text-lg font-semibold text-gray-800">
                                €{product.price.toFixed(2)}
                            </span>
                        </>
                    ) : (
                        <span className="text-md text-gray-500">Price on request</span>
                    )}
                </div>

                {/* Plus button in bottom-right. */}
                <div
                    onClick={handlePlusClick}
                    onMouseEnter={() => setHoverPlus(true)}
                    onMouseLeave={() => setHoverPlus(false)}
                    className={`
            absolute bottom-0 right-[-1px]
            bg-[#e6e6e7] text-gray-700
            rounded-tl-lg
            px-6 py-3
            transition
            border-t-[2px] border-l-[2px] 
            border-transparent
          `}
                    style={{
                        borderTopLeftRadius: "0.5rem",
                        // use brandCTA for the "hover" border color
                        borderTopColor: plusButtonBorder,
                        borderLeftColor: plusButtonBorder,
                    }}
                >
                    {loadingState === "loading" ? (
                        // Minimal spinner
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            className="animate-spin"
                            strokeWidth="3"
                            fill="none"
                            // Instead of text-green-600 => brand color
                            style={{ color: brandCTA }}
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" className="opacity-20" />
                            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                        </svg>
                    ) : loadingState === "check" ? (
                        // Check icon => stroke brandCTA
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke={brandCTA}
                            strokeWidth="3"
                        >
                            <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        // The plus icon => stroke brandCTA
                        <svg width="16" height="16" fill="none" stroke={brandCTA} strokeWidth="2">
                            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}
