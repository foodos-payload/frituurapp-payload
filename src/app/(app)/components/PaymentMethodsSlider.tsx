"use client";

import React from "react";
import { IoCashOutline } from "react-icons/io5";
import { motion } from "framer-motion";

/** Minimal shape for your branding, if needed for styling. */
interface Branding {
    primaryColorCTA?: string;
    categoryCardBgColor?: string;
    borderRadius?: number; // e.g., 0.5 => "0.5rem"
    // ...other brand fields if needed
}

/** Example PaymentMethod shape. */
interface PaymentMethod {
    id: string;       // e.g. "6785597626fb613afcf69ba1"
    label: string;    // e.g. "multisafepay" or "cash_on_delivery"
    enabled: boolean;
    multisafepay_settings?: {
        methods?: string[]; // e.g. ["MSP_Bancontact", "MSP_Visa", ...]
    };
}

interface PaymentMethodsSliderProps {
    branding?: Branding;
    paymentMethods?: PaymentMethod[];
}

/**
 * A horizontal list (non-auto-scrolling) that shows your payment-method cards.
 * - "cash_on_delivery" becomes "cash"
 * - "multisafepay" sub-methods get expanded (Visa, MasterCard, Bancontact, etc.)
 * - Larger card style, hidden scrollbar, dynamic border radius, subtle box shadow.
 * - Each card slides in from the left on scroll using Framer Motion.
 * - The heading (“Betaalmethodes”) also slides in from the left.
 */
export default function PaymentMethodsSlider({
    branding,
    paymentMethods = [],
}: PaymentMethodsSliderProps) {
    // If no payment methods => fallback
    if (!paymentMethods.length) {
        return (
            <section id="payment" className="py-20 bg-white">
                <div className="max-w-[1200px] mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-20">Betaalmethodes</h2>
                    <p>No payment methods found...</p>
                </div>
            </section>
        );
    }

    // Heading color: fallback to #CE2027 if categoryCardBgColor is missing
    const headingColor = branding?.categoryCardBgColor || "#CE2027";

    // Flatten "multisafepay" => sub-methods, and transform "cash_on_delivery" => "cash"
    const flattenedMethods: string[] = [];
    paymentMethods.forEach((pm) => {
        const labelLC = pm.label.toLowerCase();
        if (labelLC === "cash_on_delivery") {
            flattenedMethods.push("cash");
        } else if (labelLC === "multisafepay" && pm.multisafepay_settings?.methods) {
            pm.multisafepay_settings.methods.forEach((sub) => flattenedMethods.push(sub));
        } else {
            flattenedMethods.push(pm.label);
        }
    });

    return (
        <section id="payment" className="py-20 bg-white">
            <div className="max-w-[1200px] mx-auto px-4">
                {/* Slide-in heading */}
                <motion.h2
                    className="text-3xl font-bold mb-20"
                    initial={{ x: -60, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, amount: 0.2 }}
                >
                    Betaalmethodes
                </motion.h2>

                {/* Horizontal list with no scrollbar */}
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    {flattenedMethods.map((label, i) => (
                        <PaymentMethodCard
                            key={`${label}-${i}`}
                            providerLabel={label}
                            borderRadius={branding?.borderRadius}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * A single card for each method.
 * - If recognized => local image or MSP icon
 * - If “cash” => show IoCashOutline
 * - Fallback => text only
 * - Slides in from left when it enters the viewport (Framer Motion).
 */
function PaymentMethodCard({
    providerLabel,
    borderRadius,
}: {
    providerLabel: string;
    borderRadius?: number;
}) {
    const labelLC = providerLabel.toLowerCase();

    // If recognized as MSP => map to GitHub icon
    const mspIcon = mapMultiSafepayIcon(labelLC);
    if (mspIcon) {
        return (
            <MotionMethodCard borderRadius={borderRadius}>
                <img
                    src={mspIcon}
                    alt={providerLabel}
                    className="w-[100px] h-[60px] object-contain mb-2"
                />
                <span className="text-base font-medium text-gray-700">
                    {niceLabel(providerLabel)}
                </span>
            </MotionMethodCard>
        );
    }

    // If “cash”
    if (labelLC.includes("cash")) {
        return (
            <MotionMethodCard borderRadius={borderRadius}>
                <IoCashOutline size={60} className="mb-2 text-gray-600" />
                <span className="text-base font-medium text-gray-700">
                    {niceLabel(providerLabel)}
                </span>
            </MotionMethodCard>
        );
    }

    // Local icon?
    const localIcon = mapLocalIcon(labelLC);
    if (localIcon) {
        return (
            <MotionMethodCard borderRadius={borderRadius}>
                <img
                    src={localIcon}
                    alt={providerLabel}
                    className="w-[100px] h-[60px] object-contain mb-2"
                />
                <span className="text-base font-medium text-gray-700">
                    {niceLabel(providerLabel)}
                </span>
            </MotionMethodCard>
        );
    }

    // Fallback => text
    return (
        <MotionMethodCard borderRadius={borderRadius}>
            <div className="w-[100px] h-[60px] bg-gray-100 flex items-center justify-center mb-2">
                <span className="text-base text-gray-600">{niceLabel(providerLabel)}</span>
            </div>
            <span className="text-base font-medium text-gray-700">{niceLabel(providerLabel)}</span>
        </MotionMethodCard>
    );
}

/** 
 * A wrapped version of MethodCard that uses Framer Motion to animate 
 * in from the left (slide + fade) when it enters the viewport.
 */
function MotionMethodCard({
    children,
    borderRadius,
}: {
    children: React.ReactNode;
    borderRadius?: number;
}) {
    // We'll define the "slide from left" + fade variants
    const variants = {
        hidden: { x: -50, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <motion.div
            className="inline-block"
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ display: "inline-block" }}
        >
            <MethodCard borderRadius={borderRadius}>{children}</MethodCard>
        </motion.div>
    );
}

/**
 * Card container with bigger style, dynamic border radius, and subtle box shadow.
 */
function MethodCard({
    children,
    borderRadius,
}: {
    children: React.ReactNode;
    borderRadius?: number;
}) {
    // Convert numeric (e.g. 0.5) => "0.5rem", default = "0.5rem"
    const cardRadius = borderRadius !== undefined ? `${borderRadius}rem` : "0.5rem";

    return (
        <div
            className="
        inline-flex flex-col items-center justify-center
        bg-white border border-gray-200 flex-shrink-0
      "
            style={{
                width: "200px",
                height: "180px",
                borderRadius: cardRadius,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
        >
            {children}
        </div>
    );
}

/** 
 * For recognized MultiSafepay sub-method strings, return the raw GitHub icon URL 
 */
function mapMultiSafepayIcon(labelLC: string): string {
    if (labelLC.includes("visa")) {
        return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/visa.svg";
    }
    if (labelLC.includes("mastercard")) {
        return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/mastercard.svg";
    }
    if (labelLC.includes("bancontact")) {
        return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/bancontact.svg";
    }
    if (labelLC.includes("ideal")) {
        return "https://raw.githubusercontent.com/MultiSafepay/MultiSafepay-icons/master/methods/ideal.svg";
    }
    return "";
}

/**
 * If we have local icons for certain labels (besides MSP).
 */
function mapLocalIcon(labelLC: string) {
    if (labelLC.includes("bancontact")) {
        return "/images/bancontact.png";
    }
    if (labelLC.includes("visa")) {
        return "/images/visa.png";
    }
    if (labelLC.includes("mastercard")) {
        return "/images/mastercard.png";
    }
    if (labelLC.includes("ideal")) {
        return "/images/ideal.png";
    }
    return "";
}

/** 
 * Quick label normalizer: remove “msp_” or “MSP_”, uppercase first letter 
 */
function niceLabel(raw: string) {
    const noMsp = raw.replace(/msp_/i, "");
    return noMsp.charAt(0).toUpperCase() + noMsp.slice(1);
}
