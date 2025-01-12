"use client";

import React, { useState } from "react";
import Image from "next/image";

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
     * If `shouldShowSpinner` is true, we run a local spinner animation
     * after `handleAction` is called. If false, no spinner is shown.
     */
    shouldShowSpinner?: boolean;
    branding?: Branding;

    /**
     * The callback from the parent that decides:
     * - if no popups => do an add-to-cart
     * - if has popups => open the popup
     */
    handleAction?: (prod: ProductCardProps) => void;

    /** Ref to your “Cart” element, for measuring fly-to-cart position. */
    cartRef?: React.RefObject<HTMLDivElement | null>;
    productRef?: React.RefObject<HTMLDivElement | null>;

    /** If true => use kiosk (vertical) layout instead of original horizontal. */
    isKiosk?: boolean;
}

/**
 * ProductCard that conditionally uses kiosk vs. classic layout,
 * and optionally shows a spinner / “fly to cart” animation.
 */
export default function ProductCard({
    product,
    shouldShowSpinner = false,
    handleAction,
    branding,
    cartRef,
    productRef,
    isKiosk = false,
}: Props) {
    const [loadingState, setLoadingState] = useState<"idle" | "loading" | "check">("idle");
    const [hoverPlus, setHoverPlus] = useState(false);

    /** Spinner: set "loading" → "check" → revert "idle". */
    function runLocalSpinner() {
        setLoadingState("loading");
        setTimeout(() => {
            setLoadingState("check");
            setTimeout(() => {
                setLoadingState("idle");
            }, 1000);
        }, 1000);
    }

    // *** FLY ANIMATION SNIPPET ***
    async function flyToCart(e: React.MouseEvent, imgEl: HTMLImageElement | null) {
        if (!cartRef?.current || !imgEl) return;

        // 1) Clone the image
        const flyingImg = imgEl.cloneNode(true) as HTMLImageElement;
        flyingImg.style.position = "absolute";
        flyingImg.style.zIndex = "9999";
        flyingImg.style.width = `${imgEl.offsetWidth}px`;
        flyingImg.style.height = `${imgEl.offsetHeight}px`;

        // Use scrollX/scrollY if page is scrolled
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;

        // Position it at the image's current bounding box
        const rect = imgEl.getBoundingClientRect();
        flyingImg.style.left = `${rect.left + scrollX}px`;
        flyingImg.style.top = `${rect.top + scrollY}px`;
        flyingImg.style.transition = "transform 1s ease-in-out, opacity 1s ease-in-out";
        document.body.appendChild(flyingImg);

        // 2) Find the cart icon or fallback to entire cartRef
        const iconEl = cartRef.current.querySelector(".cart-icon") as HTMLElement | null;
        const cartRect = iconEl
            ? iconEl.getBoundingClientRect()
            : cartRef.current.getBoundingClientRect();

        // 3) Animate center → center
        requestAnimationFrame(() => {
            const flyingRect = flyingImg.getBoundingClientRect();
            const deltaX =
                cartRect.left + cartRect.width / 2 - (flyingRect.left + flyingRect.width / 2);
            const deltaY =
                cartRect.top + cartRect.height / 2 - (flyingRect.top + flyingRect.height / 2);

            flyingImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
            flyingImg.style.opacity = "0.3";
        });

        // 4) Cleanup after animation
        setTimeout(() => {
            flyingImg.remove();

            // 5) Wiggle/pulse the .cart-icon
            if (iconEl) {
                iconEl.classList.add("cart-wiggle");
                setTimeout(() => iconEl.classList.remove("cart-wiggle"), 800);
            }
        }, 1000);
    }

    /** Called when the entire card is clicked. */
    function handleCardClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (!handleAction) return;

        handleAction(product); // e.g. add to cart or open popup

        if (shouldShowSpinner) {
            const cardEl = (e.currentTarget as HTMLElement).closest(".product-card-outer") as HTMLElement;
            const imgEl = cardEl?.querySelector(".product-img") as HTMLImageElement | null;
            flyToCart(e, imgEl);
            runLocalSpinner();
        }
    }

    /** Called when plus button is clicked. */
    function handlePlusClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (!handleAction) return;

        handleAction(product);
        if (shouldShowSpinner) {
            const cardEl = (e.currentTarget as HTMLElement).closest(".product-card-outer") as HTMLElement;
            const imgEl = cardEl?.querySelector(".product-img") as HTMLImageElement | null;
            flyToCart(e, imgEl);
            runLocalSpinner();
        }
    }

    // 1) Gather brand color or fallback
    const brandCTA = branding?.primaryColorCTA || "#068b59";
    // 2) Border color for the plus button on hover
    const plusButtonBorder = hoverPlus ? brandCTA : "transparent";

    // ========== Original “non-kiosk” container classes ================
    const originalContainerClasses = `
    product-card-outer
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
  `;

    // ========== Kiosk container classes ================
    const kioskContainerClasses = `
    product-card-outer
    relative
    border border-gray-300
    rounded-lg
    overflow-hidden
    shadow-lg
    bg-white
    cursor-pointer
    hover:shadow-xl
    transition-shadow
    w-full

    /* vertical layout */
    flex-col
    max-w-md
    min-h-[350px]
  `;

    return (
        <div
            onClick={handleCardClick}
            style={{ borderRadius: "0.5rem" }}
            ref={productRef}
            className={isKiosk ? kioskContainerClasses : originalContainerClasses}
        >
            {/* Promotion badge */}
            {product.isPromotion && (
                <div
                    className="absolute top-0 left-0 text-white text-md font-semibold px-2 py-1 rounded z-20"
                    style={{ backgroundColor: brandCTA || "red" }}
                >
                    Promotion
                </div>
            )}

            {/* ========== Image Area ========== */}
            {!isKiosk ? (
                // Non-kiosk => original horizontal layout
                <div className="relative w-2/5 h-full flex items-center justify-center bg-gray-50">
                    {product.image?.url ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={product.image.url}
                                alt={product.image.alt || product.displayName}
                                fill // <-- replaces layout="fill"
                                className="product-img mix-blend-multiply object-cover" // <-- objectFit="cover" => object-cover class
                            />
                        </div>
                    ) : (
                        <div className="text-gray-300 text-md p-4">No Image</div>
                    )}
                </div>

            ) : (
                // Kiosk => bigger, top-centered image
                <div className="relative w-full flex items-center justify-center bg-gray-50 mb-2 h-[190px]">
                    {product.image?.url ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={encodeURI(product.image.url)}
                                alt={product.image.alt || product.displayName}
                                fill // same approach
                                className="product-img mix-blend-multiply object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-gray-300 text-md p-4">No Image</div>
                    )}
                </div>
            )
            }

            {/* ========== Text + Price + Plus Button ========== */}
            {
                !isKiosk ? (
                    // Non-kiosk => original styling
                    <div className="w-3/5 p-4 flex flex-col justify-between relative">
                        <div>
                            <h2 className="text-lg font-bold mb-1 line-clamp-2">{product.displayName}</h2>
                            {product.displayDesc && (
                                <p className="text-md text-gray-600 line-clamp-3 mb-2">{product.displayDesc}</p>
                            )}
                        </div>

                        {/* Price row */}
                        <div className="mt-2">
                            {typeof product.price === "number" ? (
                                <>
                                    {product.isPromotion && product.old_price && (
                                        <span className="text-sm text-gray-500 line-through mr-2">
                                            €{product.old_price.toFixed(2)}
                                        </span>
                                    )}
                                    <span className="text-lg font-semibold text-gray-800">
                                        €{product.price.toFixed(2)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-md text-gray-500">Price on request</span>
                            )}
                        </div>

                        {/* The plus button in bottom-right */}
                        <div
                            onClick={handlePlusClick}
                            onMouseEnter={() => setHoverPlus(true)}
                            onMouseLeave={() => setHoverPlus(false)}
                            className="
              absolute bottom-0 right-[-1px]
              bg-[#e6e6e7] text-gray-700
              rounded-tl-lg
              px-6 py-3
              transition
              border-t-[2px] border-l-[2px]
              border-transparent
            "
                            style={{
                                borderTopLeftRadius: "0.5rem",
                                borderTopColor: plusButtonBorder,
                                borderLeftColor: plusButtonBorder,
                            }}
                        >
                            {loadingState === "loading" ? (
                                /* Minimal spinner */
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    className="animate-spin"
                                    strokeWidth="3"
                                    fill="none"
                                    style={{ color: brandCTA }}
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="10" className="opacity-20" />
                                    <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                                </svg>
                            ) : loadingState === "check" ? (
                                /* Check icon => stroke brandCTA */
                                <svg width="16" height="16" fill="none" stroke={brandCTA} strokeWidth="3">
                                    <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                /* The plus icon => stroke brandCTA */
                                <svg width="16" height="16" fill="none" stroke={brandCTA} strokeWidth="2">
                                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                    </div>
                ) : (
                    // Kiosk => vertical layout
                    <div className="flex flex-col flex-1">
                        {/* Extra wrapper for spacing */}
                        <div className="flex-1 p-2 flex flex-col justify-between">
                            <div>
                                <h2 className="text-2xl pl-2 font-bold mb-3 line-clamp-2">
                                    {product.displayName}
                                </h2>
                                {product.displayDesc && (
                                    <p className="text-lg pl-2 text-gray-600 line-clamp-4 mb-2 min-h-[60px]">
                                        {product.displayDesc}
                                    </p>
                                )}
                            </div>

                            {/* Price row */}
                            <div className="mt-2">
                                {typeof product.price === "number" ? (
                                    <>
                                        {product.isPromotion && product.old_price && (
                                            <span className="text-sm text-gray-500 line-through mr-2">
                                                €{product.old_price.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-2xl pl-2 font-semibold text-gray-800">
                                            €{product.price.toFixed(2)}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-md text-gray-500">Price on request</span>
                                )}
                            </div>
                        </div>

                        {/* The plus button at bottom */}
                        <div
                            onClick={handlePlusClick}
                            onMouseEnter={() => setHoverPlus(true)}
                            onMouseLeave={() => setHoverPlus(false)}
                            className="
              mt-4 self-end
              bg-[#e6e6e7]
              text-gray-700
              rounded-tl-lg
              px-6 py-3
              transition
              border-t-[2px]
              border-l-[2px]
              border-transparent
            "
                            style={{
                                borderTopLeftRadius: "0.5rem",
                                borderTopColor: plusButtonBorder,
                                borderLeftColor: plusButtonBorder,
                            }}
                        >
                            {loadingState === "loading" ? (
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    className="animate-spin"
                                    strokeWidth="3"
                                    fill="none"
                                    style={{ color: brandCTA }}
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="10" className="opacity-20" />
                                    <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                                </svg>
                            ) : loadingState === "check" ? (
                                <svg width="16" height="16" fill="none" stroke={brandCTA} strokeWidth="3">
                                    <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" fill="none" stroke={brandCTA} strokeWidth="2">
                                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
