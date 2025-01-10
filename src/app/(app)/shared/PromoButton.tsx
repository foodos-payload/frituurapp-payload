"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import PromoCodeModal from "./PromoCodeModal";  // or wherever your modal is

type Props = {
    // Optionally any extra label or styling props you want
    label?: string;
    buttonClass?: string;
};

export default function PromoButton({
    label = "Apply Promo Code / Scan QR",
    buttonClass = "bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-3 py-2"
}: Props) {
    // (A) Access the cart context
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

        customer
    } = useCart();

    // (B) Local states for the PromoCodeModal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<"codeInput" | "customerOptions">("codeInput");

    // (C) If there's a “CUST-” code recognized => switch step to "customerOptions"
    useEffect(() => {
        if (modalOpen && customer && modalStep === "codeInput") {
            setModalStep("customerOptions");
        }
    }, [modalOpen, customer, modalStep]);

    // (D) hasCouponApplied => if coupon or giftVoucher is active
    const hasCouponApplied = Boolean(coupon) || Boolean(giftVoucher);

    // (E) onRemoveCoupon => remove whichever code is applied
    function handleRemoveCoupon() {
        if (coupon) removeCoupon();
        if (giftVoucher) removeGiftVoucher();
    }

    // (F) handle code submission
    async function handleApplyCode(code: string) {
        setModalStep("codeInput");
        if (code.toUpperCase().startsWith("CUST-")) {
            await fetchCustomerByCode(code);
        } else if (code.toUpperCase().startsWith("GV")) {
            await applyGiftVoucher(code);
            setModalOpen(false); // close if gift voucher
        } else {
            await applyCoupon(code);
            setModalOpen(false); // close if normal coupon
        }
    }

    return (
        <>
            {/* The button that toggles the modal */}
            <button
                onClick={() => {
                    setModalStep(customer ? "customerOptions" : "codeInput");
                    setModalOpen(true);
                }}
                className={"bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl shadow-sm focus:outline-none inline-flex items-centergap-2 w-full text-center items-center justify-center"}
            >
                {label}
            </button>

            {/* The modal itself */}
            <PromoCodeModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalStep("codeInput");
                }}
                step={modalStep}
                customer={customer ? {
                    firstname: customer.firstname,
                    lastname: customer.lastname,
                    memberships: customer.memberships,
                } : undefined}
                // If your server or context provides total store credits:
                totalCredits={customer?.totalCredits ?? 0}
                onSubmitCode={handleApplyCode}

                // Points usage
                onApplyPoints={(points) => applyPointsUsage(points)}
                onRemovePoints={() => removePointsUsage()}

                // Credits usage
                onApplyCredits={(credits) => applyCustomerCredits(credits)}
                onRemoveCredits={() => removeCreditsUsage()}

                // The coupon usage
                hasCouponApplied={hasCouponApplied}
                onRemoveCoupon={handleRemoveCoupon}

                // If you want to show how many points or credits are already used
                currentlyUsedPoints={pointsUsed}
                currentlyUsedCredits={creditsUsed}
            />
        </>
    );
}
