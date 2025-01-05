// File: /app/(app)/bestellen/components/cart/CartButton.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // or 'next/router' if older Next
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import { useCart } from './CartContext';

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
 * - A "Go Back" button (hidden on mobile).
 * - A large "Continue to Cart" button with item count badge.
 */
export default function CartButton({ onClick, branding, isKiosk = false, }: Props) {
    const router = useRouter();
    const { items, getCartTotal } = useCart();

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = getCartTotal();

    const brandCTA = branding?.primaryColorCTA || "#3b82f6";

    // For the "Go Back" button
    function handleGoBack() {
        // either navigate to homepage or history.back(), etc.
        router.push('/index');
    }

    return (
        <div
            className="
        fixed bottom-0 left-0 w-full
        bg-white    /* or your custom 'bg-color-footer' */
        shadow-top   /* replicate old .shadow-top style if needed */
        py-3
        z-49
        flex justify-center items-center
      "
        >
            <div
                className="
          containercustommaxwidth container
          flex justify-between items-center
          px-4
        "
            >
                {/* Go Back button: only visible on md+ screens */}
                <button
                    onClick={handleGoBack}
                    style={{ borderRadius: '0.5rem' }}
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
                >
                    <FiArrowLeft />
                    <span>Go Back</span>
                </button>

                {/* Large "Continue to Cart" button */}
                <div className="relative w-full md:w-auto flex justify-center md:flex-none">
                    <button
                        onClick={onClick}
                        style={{
                            borderRadius: '0.5rem',
                            backgroundColor: brandCTA,
                        }}
                        className="
              whitespace-nowrap
              rounded-lg
              flex
              items-center
              justify-center
              text-white
              p-2.5
              gap-2
              focus:outline-none
              w-full md:w-auto
              text-lg
              font-semibold
            "
                    >
                        <div className="relative text-2xl">
                            <FiShoppingCart className="mr-5 cart-icon" />

                            {/* Red badge for itemCount */}
                            {itemCount > 0 && (
                                <span
                                    className="
                    absolute
                    bg-red-600
                    text-white
                    text-[13px]
                    font-semibold
                    rounded-full
                    leading-none
                    px-2
                    -top-4
                    py-1
                    
                  "
                                >
                                    {itemCount}
                                </span>
                            )}
                        </div>

                        <span>Continue to Cart</span>

                        {/* Show total price in parentheses if we have items */}
                        {itemCount > 0 && (
                            <span className="ml-1 text-sm">
                                (€{totalPrice.toFixed(2)})
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
