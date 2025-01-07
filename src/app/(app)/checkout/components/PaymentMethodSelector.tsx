"use client";

import React, { Dispatch, SetStateAction } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { IoCashOutline } from "react-icons/io5";
import { PaymentMethod } from "./CheckoutPage";

/** 
 * Example shape:
 *   paymentMethods = [
 *     { 
 *       id: "...", 
 *       label: "multisafepay", 
 *       enabled: true, 
 *       multisafepay_settings: {
 *         enable_test_mode: true,
 *         methods: ["MSP_Bancontact", "MSP_Visa"]
 *       } 
 *     },
 *     { id: "...", label: "cash_on_delivery", enabled: true },
 *   ]
 */

interface PaymentMethodSelectorProps {
    paymentMethods: PaymentMethod[];
    selectedPaymentId: string;
    setSelectedPaymentId: Dispatch<SetStateAction<string>>;
}

export default function PaymentMethodSelector({
    paymentMethods,
    selectedPaymentId,
    setSelectedPaymentId,
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

    return (
        <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Payment Method</h2>

            <div className="grid gap-3 sm:grid-flow-col">
                {displayItems.map((item) => {
                    // If disabled => render a greyed-out, non-clickable element
                    if (item.enabled === false) {
                        return (
                            <div
                                key={item.id}
                                className="relative flex flex-col items-center justify-center gap-2 p-3
                  rounded-xl border text-sm font-semibold bg-gray-100 text-gray-400
                  cursor-not-allowed"
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
                            className={`
                relative flex flex-col items-center justify-center gap-2 p-3
                rounded-xl border text-sm font-semibold hover:border-green-500 transition-colors
                ${isActive
                                    ? "bg-green-50 border-green-500 text-green-700 border-2"
                                    : "bg-white border-gray-300 text-gray-700"
                                }
              `}
                        >
                            {renderIcon(item)}
                            <span className="text-center">{item.label}</span>

                            {isActive && (
                                <div className="absolute bottom-2 right-2 text-green-600">
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
    // If it's "cash_on_delivery"/"Cash", show the IoCashOutline
    if (item.isCash) {
        return <IoCashOutline className="w-10 h-10" />;
    }
    // Otherwise, show an <img> if we have iconUrl
    if (item.iconUrl) {
        return <img src={item.iconUrl} alt={item.label} className="w-15 h-10 object-contain" />;
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
