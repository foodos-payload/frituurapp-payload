"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import PromoCodeModal from "./PromoCodeModal"; // or wherever your modal is

type Props = {
    label?: string;
    /** Additional classes for styling (e.g. bigger text in kiosk mode) */
    buttonClass?: string;
    isKiosk?: boolean;
};

export default function PromoButton({
    label = "Apply Promo Code / Scan QR",
    buttonClass = "",
    isKiosk = false,
}: Props) {
    const {
        fetchCustomerByCode,
        applyCoupon,
        applyGiftVoucher,
        coupon,
        giftVoucher,
        removeCoupon,
        removeGiftVoucher,
        applyPointsUsage,
        removePointsUsage,
        pointsUsed,
        applyCustomerCredits,
        removeCreditsUsage,
        creditsUsed,
        customer,

    } = useCart();

    // State for the modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<"codeInput" | "customerOptions">("codeInput");

    // NEW: Local spinner state for the button
    const [loadingState, setLoadingState] = useState<"idle" | "loading">("idle");

    // If we already have a recognized customer => skip codeInput
    useEffect(() => {
        if (modalOpen && customer && modalStep === "codeInput") {
            setModalStep("customerOptions");
        }
    }, [modalOpen, customer, modalStep]);

    const hasCouponApplied = Boolean(coupon) || Boolean(giftVoucher);

    function handleRemoveCoupon() {
        if (coupon) removeCoupon();
        if (giftVoucher) removeGiftVoucher();
    }

    // This is called by the PromoCodeModal after user enters code
    async function handleApplyCode(code: string) {
        setModalStep("codeInput");

        // If code is 'GV...' => gift voucher, or normal => coupon
        if (code.toUpperCase().startsWith("CUST-")) {
            await fetchCustomerByCode(code);
        } else if (code.toUpperCase().startsWith("GV")) {
            await applyGiftVoucher(code);
            setModalOpen(false);
        } else {
            await applyCoupon(code);
            setModalOpen(false);
        }
    }

    // Wrap your onClick with the local spinner
    async function handleOpenModal() {
        setLoadingState("loading");
        try {
            // If you had any async logic before opening the modal, do it here:
            // e.g. await fetchSomething();
            setModalStep(customer ? "customerOptions" : "codeInput");
            setModalOpen(true);
        } finally {
            setLoadingState("idle");
        }
    }

    return (
        <>
            <button
                onClick={handleOpenModal}
                disabled={loadingState === "loading"}
                className={`
          bg-black hover:bg-blue-600 text-white font-semibold 
          px-4 py-2 rounded-xl shadow-sm focus:outline-none inline-flex
          items-center gap-2 w-full text-center justify-center
          disabled:opacity-50
          ${buttonClass}
        `}
            >
                {loadingState === "loading" ? (
                    <SpinnerIcon />
                ) : (
                    label
                )}
            </button>

            <PromoCodeModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalStep("codeInput");
                }}
                step={modalStep}
                isKiosk={isKiosk}
                customer={
                    customer
                        ? {
                            firstname: customer.firstname,
                            lastname: customer.lastname,
                            memberships: customer.memberships,
                        }
                        : undefined
                }
                totalCredits={customer?.totalCredits ?? 0}
                onSubmitCode={handleApplyCode}
                onApplyPoints={(points) => applyPointsUsage(points)}
                onRemovePoints={() => removePointsUsage()}
                onApplyCredits={(credits) => applyCustomerCredits(credits)}
                onRemoveCredits={() => removeCreditsUsage()}
                hasCouponApplied={hasCouponApplied}
                onRemoveCoupon={handleRemoveCoupon}
                currentlyUsedPoints={pointsUsed}
                currentlyUsedCredits={creditsUsed}

            />
        </>
    );
}

// A simple spinner icon
function SpinnerIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="animate-spin"
            strokeWidth="3"
            fill="none"
            stroke="currentColor"
        >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
        </svg>
    );
}
