"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation"; // or "next/router" if older Next
import { FiShoppingCart, FiArrowLeft } from "react-icons/fi";
import { useCart } from "../../../../../context/CartContext";
import { useTranslation } from "@/context/TranslationsContext";
type Branding = {
    categoryCardBgColor?: string;
    primaryColorCTA?: string;
    // ... any others if needed
};

type Props = {
    /** Called when the user clicks "Continue to Cart" button */
    onClick: () => void;
    branding?: Branding;
    isKiosk?: boolean;
};

/**
 * A bottom bar similar to the old Vue component:
 * - A "Go Back" button (hidden on md+ screens).
 * - A large "Continue to Cart" button with item count badge.
 */
export default function CartButton({
    onClick,
    branding,
    isKiosk = false,
}: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const { items, getCartTotal } = useCart();

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = getCartTotal();
    const [goBackLoading, setGoBackLoading] = useState(false);

    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    // For the "Go Back" button
    function handleGoBack() {
        // If already loading (button pressed once), do nothing
        if (goBackLoading) return;

        setGoBackLoading(true);

        // Optionally: we could do a small setTimeout if you want a forced delay,
        // but typically the route transitions quickly:
        if (isKiosk) {
            router.push("/index?kiosk=true");
        } else {
            router.push("/index");
        }
    }

    // 1) Conditionals for kiosk vs. normal
    const outerPadding = isKiosk ? "py-6" : "py-3";
    const buttonTextSize = isKiosk ? "text-3xl" : "text-lg";
    const plusIconSize = isKiosk ? "text-4xl mr-4" : "text-2xl mr-5";
    const badgeText = isKiosk ? "text-[18px]" : "text-[13px]";
    const buttonPadding = isKiosk ? "py-4 px-5" : "p-2.5";
    const priceSize = isKiosk ? "text-xl" : "text-md";

    return (
        <div
            className={`
        fixed bottom-0 left-0 w-full
        bg-white
        shadow-top
        ${outerPadding}
        z-49
        flex justify-center items-center
      `}
        >
            <div
                className={`
          containercustommaxwidth container
          flex justify-between items-center
          px-4
        `}
            >
                {/* Go Back button: only visible on md+ screens */}
                <button
                    onClick={handleGoBack}
                    style={{ borderRadius: "0.5rem" }}
                    className="
                        hidden md:flex
                        rounded-lg
                        border border-[#CE2027]
                        text-[#CE2027]
                        font-bold
                        p-2.5
                        gap-2
                        items-center
                        justify-center
                        focus:outline-none
                    "
                    disabled={goBackLoading}
                >
                    {goBackLoading ? (
                        // Spinner SVG
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            className="animate-spin"
                            strokeWidth="3"
                            fill="none"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" className="opacity-20" />
                            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                        </svg>
                    ) : (
                        // Original arrow icon
                        <FiArrowLeft />
                    )}

                    <span className={`${buttonTextSize}`}>{t("order.footer.go_back")}</span>
                </button>

                {/* Large "Continue to Cart" button */}
                <div className="relative w-full md:w-auto flex justify-center md:flex-none">
                    <button
                        onClick={onClick}
                        style={{
                            borderRadius: "0.5rem",
                            backgroundColor: brandCTA,
                        }}
                        className={`
              whitespace-nowrap
              rounded-lg
              flex
              items-center
              justify-center
              text-white
              ${buttonPadding}
              gap-2
              focus:outline-none
              w-full md:w-auto
              ${buttonTextSize}
              font-semibold
            `}
                    >
                        <div className={`relative ${plusIconSize}`}>
                            <FiShoppingCart className="cart-icon" />

                            {/* Red badge for itemCount */}
                            {itemCount > 0 && (
                                <span
                                    className={`
                    absolute
                    bg-red-600
                    text-white
                    font-semibold
                    rounded-full
                    leading-none
                    px-2
                    -top-4
                    py-1
                    ${badgeText}
                  `}
                                    style={{
                                        // Slightly bigger badge on kiosk if you like:
                                        transform: isKiosk ? "translateX(30%)" : "",
                                    }}
                                >
                                    {itemCount}
                                </span>
                            )}
                        </div>

                        <span>{t("order.footer.continue_to_cart")}</span>

                        {/* Show total price in parentheses if we have items */}
                        {itemCount > 0 && (
                            <span className={`ml-1 text-sm ${priceSize}`}>
                                (€{totalPrice.toFixed(2)})
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
