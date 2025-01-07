"use client";

import React, { Dispatch, SetStateAction, useEffect } from "react";
import Image from "next/image";
import { FiCheckCircle } from "react-icons/fi";
import { IoCashOutline } from "react-icons/io5";
import { PaymentMethod } from "./CheckoutPage";

/** 
 * The partial shape of your branding object.
 * If primaryColorCTA is not provided, we fallback to "#22c55e" (green).
 */
type Branding = {
    primaryColorCTA?: string;
    // ...
};

interface PaymentMethodSelectorProps {
    paymentMethods: PaymentMethod[];
    selectedPaymentId: string;
    setSelectedPaymentId: Dispatch<SetStateAction<string>>;
    branding: Branding;
}

export default function PaymentMethodSelector({
    paymentMethods,
    selectedPaymentId,
    setSelectedPaymentId,
    branding,
}: PaymentMethodSelectorProps) {
    /**
     * Flatten or expand sub-methods for MultiSafePay.
     */
    const displayItems = paymentMethods.flatMap((pm) => {
        // Expand each sub-method if "multisafepay"
        if (pm.label === "multisafepay" && pm.multisafepay_settings?.methods?.length) {
            return pm.multisafepay_settings.methods.map((subMethod: string) => {
                const shortLabel = subMethod.replace(/^MSP_/, ""); // e.g. "Bancontact"
                return {
                    id: `${pm.id}:${subMethod}`, // unique ID for selection
                    label: shortLabel,
                    enabled: pm.enabled,
                    iconUrl: mapMultiSafepayIcon(shortLabel),
                    isCash: false,
                };
            });
        }

        // Otherwise, a single method
        const isCash = pm.label === "cash_on_delivery";
        return [
            {
                id: pm.id,
                label: isCash ? "Cash" : pm.label,
                enabled: pm.enabled,
                iconUrl: isCash ? "" : guessIconForGenericMethod(pm.label),
                isCash,
            },
        ];
    });

    /**
     * (A) On mount / whenever paymentMethods change,
     * automatically select the first *enabled* item if none is selected.
     */
    useEffect(() => {
        if (!selectedPaymentId && displayItems.length > 0) {
            // Optionally, pick the *first enabled* item
            const firstEnabled = displayItems.find((item) => item.enabled);
            if (firstEnabled) {
                setSelectedPaymentId(firstEnabled.id);
            }
        }
    }, [displayItems, selectedPaymentId, setSelectedPaymentId]);

    // BRAND COLOR (fallback to #22c55e if missing)
    const brandColor = branding.primaryColorCTA || "#22c55e";

    return (
        <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Payment Method</h2>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {displayItems.map((item) => {
                    // If disabled => show a greyed-out, non-clickable element
                    if (item.enabled === false) {
                        return (
                            <div
                                key={item.id}
                                className="
                  relative flex flex-col items-center justify-center gap-2 p-3
                  rounded-xl border text-sm font-semibold
                  bg-gray-100 text-gray-400
                  cursor-not-allowed
                "
                            >
                                {renderIcon(item)}
                                <span className="text-center">{item.label} (Disabled)</span>
                            </div>
                        );
                    }

                    // Otherwise, clickable button
                    const isActive = selectedPaymentId === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setSelectedPaymentId(item.id)}
                            className="
                min-w-24 relative flex flex-col items-center justify-center gap-2 p-3
                rounded-xl border text-sm font-semibold transition-colors
                hover:opacity-80
              "
                            style={{
                                // If active, highlight with brand color
                                borderWidth: isActive ? 2 : 1,
                                borderColor: isActive ? brandColor : "#d1d5db", // gray-300
                                backgroundColor: isActive ? `${brandColor}1A` : "#ffffff",
                                color: isActive ? brandColor : "#374151", // gray-700
                            }}
                        >
                            {renderIcon(item)}
                            <span className="text-center">{item.label}</span>

                            {isActive && (
                                <div
                                    className="absolute bottom-2 right-2"
                                    style={{ color: brandColor }}
                                >
                                    <FiCheckCircle size={20} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** Renders an icon (cash or MSP) */
function renderIcon(item: { isCash: boolean; iconUrl?: string; label: string }) {
    // If it's "cash_on_delivery"/"Cash", show IoCashOutline
    if (item.isCash) {
        return <IoCashOutline className="w-10 h-10" />;
    }
    // Otherwise, show an <img> if we have iconUrl
    if (item.iconUrl) {
        return <Image src={item.iconUrl || ""} alt={item.label} width={60} height={40} className="object-contain" />;
    }
    return null;
}

/** Map short MSP label (e.g. "Visa", "Bancontact") to a known icon URL */
function mapMultiSafepayIcon(shortLabel: string): string {
    const lc = shortLabel.toLowerCase();
    switch (lc) {
        case "bancontact":
            return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/bancontact.svg";
        case "visa":
            return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/visa.svg";
        case "mastercard":
            return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/mastercard.svg";
        case "ideal":
            return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/ideal.svg";
        // etc...
        default:
            return "";
    }
}

/** Fallback icons for other non-MSP labels (e.g. "paypal") */
function guessIconForGenericMethod(label: string) {
    const lc = label.toLowerCase();
    if (lc === "paypal") {
        return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/paypal.svg";
    }
    // etc...
    return "";
}
