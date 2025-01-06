"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";
import { KioskAppHeaderHome } from "./KioskAppHeaderHome";
import { useCart } from "@/context/CartContext";

interface FulfillmentMethod {
    key: "dine-in" | "takeaway" | "delivery";
    label: string;
    methodId: string;
}
interface BrandingData {
    siteTitle?: string;
    siteHeaderImg?: string;
    primaryColorCTA?: string;
    logoUrl?: string;
    headerBackgroundColor?: string;
}

interface KioskContainerProps {
    shopSlug: string;
    fulfillmentOptions: FulfillmentMethod[];
    branding: BrandingData;
}

export const KioskContainer: React.FC<KioskContainerProps> = ({
    shopSlug,
    fulfillmentOptions,
    branding,
}) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { setShippingMethod } = useCart(); // Use CartContext

    useEffect(() => {
        localStorage.setItem("kioskMode", "true"); // Optional if still used elsewhere
    }, []);

    const selectOption = (key: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === key);
        if (!found) return;

        setShippingMethod(key); // Update shipping method in CartContext
        router.push("/order?kiosk=true"); // Navigate to order page
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
                            onClick={() => selectOption(f.key as "dine-in" | "takeaway" | "delivery")}
                            className="border border-gray-200 rounded-xl p-8 w-full w-[400px] h-[400px] flex flex-col justify-center
                             cursor-pointer transition-transform transform hover:scale-105
                             shadow-md text-center bg-[#ffffffa8]"
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
                            <p className="mt-2 text-xl text-gray-600">
                                {f.key === "dine-in"
                                    ? t("chooseMode.dineIn.hint")
                                    : f.key === "takeaway"
                                        ? t("chooseMode.takeAway.hint")
                                        : t("chooseMode.delivery.hint")}
                            </p>
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
