"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";
import { KioskAppHeaderHome } from "./KioskAppHeaderHome";
import { useCart } from "@/context/CartContext";
import { useShopBranding } from "@/context/ShopBrandingContext";

interface FulfillmentMethod {
    key: "dine-in" | "takeaway" | "delivery";
    label: string;
    methodId: string;
}

interface KioskContainerProps {
    shopSlug: string;
    fulfillmentOptions: FulfillmentMethod[];
}

export const KioskContainer: React.FC<KioskContainerProps> = ({
    shopSlug,
    fulfillmentOptions,
}) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { setShippingMethod } = useCart();
    const branding = useShopBranding();

    // Track which method is "loading" => show spinner, disable other cards
    const [loadingMethod, setLoadingMethod] = useState<"" | "dine-in" | "takeaway" | "delivery">("");

    useEffect(() => {
        localStorage.setItem("kioskMode", "true");
    }, []);

    /**
     * The original selectOption logic => sets shipping method, then navigates.
     */
    const selectOption = (key: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === key);
        if (!found) return;

        setShippingMethod(key);
        router.push("/order?kiosk=true");
    };

    /**
     * handleClickMethod => sets loading spinner for the clicked card, then calls `selectOption`.
     */
    const handleClickMethod = (key: "dine-in" | "takeaway" | "delivery") => {
        // If we already have a loading method, skip
        if (loadingMethod) return;

        setLoadingMethod(key);
        selectOption(key);
    };

    return (
        <div className="flex flex-col h-[100vh] overflow-hidden">
            {/* Header (top) */}
            <KioskAppHeaderHome
                siteTitle={branding.siteTitle ?? "My Kiosk Site"}
                siteHeaderImg={branding.siteHeaderImg ?? "/images/defaultHeader.jpg"}
                primaryColorCTA={branding.primaryColorCTA ?? "#3b82f6"}
                headerBackgroundColor={branding.headerBackgroundColor ?? "#ffffff"}
                logoUrl={branding.logoUrl ?? ""}
            />

            {/* Main content (center) */}
            <div className="flex flex-col flex-1 items-center justify-start bg-white px-8 py-4 mt-40">
                <h1 className="text-7xl font-bold text-center uppercase mt-4">
                    {t("chooseMode.title")}
                </h1>

                {/* Fulfillment options */}
                <div className="flex justify-center gap-8 mt-60">
                    {fulfillmentOptions.map((f) => (
                        <div
                            key={f.methodId}
                            onClick={() => handleClickMethod(f.key)}
                            // If any card is loading => disable pointer events on all,
                            // but user can see the spinner on the clicked one.
                            className={`
                border border-gray-200 rounded-xl p-8 w-full w-[400px] h-[400px] 
                flex flex-col justify-center items-center cursor-pointer 
                transition-transform transform hover:scale-105 
                shadow-md text-center bg-[#ffffffa8]
                ${loadingMethod ? "pointer-events-none" : ""}
              `}
                        >
                            <img
                                src={
                                    f.key === "dine-in"
                                        ? "/images/DineInIcon.png"
                                        : f.key === "takeaway"
                                            ? "/images/TakeAwayIcon.png"
                                            : "/images/DeliveryIcon.png"
                                }
                                alt={f.label}
                                className="w-full h-48 object-contain"
                            />
                            <h2 className="mt-4 text-4xl font-semibold">
                                {f.key === "dine-in"
                                    ? t("chooseMode.dineIn.label")
                                    : f.key === "takeaway"
                                        ? t("chooseMode.takeAway.label")
                                        : t("chooseMode.delivery.label")}
                            </h2>

                            {/* Show spinner if this card is clicked, else show hint text */}
                            {loadingMethod === f.key ? (
                                <div className="mt-2 flex items-center justify-center">
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        className="animate-spin text-gray-700"
                                        strokeWidth="3"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <circle cx="12" cy="12" r="10" className="opacity-25" />
                                        <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
                                    </svg>
                                </div>
                            ) : (
                                <p className="mt-2 text-xl text-gray-600">
                                    {f.key === "dine-in"
                                        ? t("chooseMode.dineIn.hint")
                                        : f.key === "takeaway"
                                            ? t("chooseMode.takeAway.hint")
                                            : t("chooseMode.delivery.hint")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer (bottom) */}
            <div className="flex justify-center items-center py-40">
                <LanguageSwitcher />
            </div>
        </div>
    );
};
