"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";
import { useCart } from "@/context/CartContext";
import { KioskContainer } from "./components/kiosk/KioskContainer";
import Image from "next/image";

interface FulfillmentMethod {
    key: "dine-in" | "takeaway" | "delivery";
    label: string;
    methodId: string;
}

interface ChooseModeProps {
    shopSlug: string;
    fulfillmentOptions: FulfillmentMethod[];
}

export const ChooseMode: React.FC<ChooseModeProps> = ({
    shopSlug,
    fulfillmentOptions,
}) => {
    const router = useRouter();
    const { t } = useTranslation();
    const { setShippingMethod, clearCart } = useCart();
    const searchParams = useSearchParams();
    const [loadingMethod, setLoadingMethod] = useState<"" | "dine-in" | "takeaway" | "delivery">("");


    // 1) Check `kiosk` and `kioskId` params
    const kioskParam = searchParams.get("kiosk"); // e.g. "true" or null
    const kioskIdParam = searchParams.get("kioskId"); // e.g. "1" or null
    const isKiosk = kioskParam === "true";

    // 2) If kiosk => filter out 'delivery'
    let filteredFulfillment = fulfillmentOptions;
    if (isKiosk) {
        filteredFulfillment = fulfillmentOptions.filter(
            (option) => option.key !== "delivery"
        );
    }

    function handleClickMethod(methodKey: "dine-in" | "takeaway" | "delivery") {
        // If we already have a loading method, skip to prevent double-clicks.
        if (loadingMethod) return;

        // 1) Set the local spinner state
        setLoadingMethod(methodKey);

        // 2) Actually proceed with the existing logic
        handleSelectOption(methodKey);
    }

    // (A) Clear cart once on initial mount
    useEffect(() => {
        console.log("[ChooseMode] Clearing cart on initial visit...");
        clearCart();
        // We intentionally don't include clearCart/isKiosk in the dependency array
        // to avoid multiple re-renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // (B) Store kiosk mode and kiosk ID in localStorage whenever isKiosk/kioskId change
    useEffect(() => {
        console.log("[ChooseMode] Setting kioskMode in localStorage =", isKiosk);
        localStorage.setItem("kioskMode", String(isKiosk));

        if (isKiosk) {
            if (kioskIdParam) {
                // e.g. "1"
                console.log("[ChooseMode] Storing kioskNumber =", kioskIdParam);
                localStorage.setItem("kioskNumber", kioskIdParam);
            } else if (!localStorage.getItem("kioskNumber")) {
                // If no kioskId provided and no existing kioskNumber, remove kioskNumber
                localStorage.removeItem("kioskNumber");
            }
        } else {
            // If not kiosk, remove kioskNumber
            localStorage.removeItem("kioskNumber");
        }
    }, [isKiosk, kioskIdParam]);

    // 3) Handle selecting a method
    const handleSelectOption = (optionKey: "dine-in" | "takeaway" | "delivery") => {
        const found = filteredFulfillment.find((f) => f.key === optionKey);
        if (!found) return;

        setShippingMethod(optionKey);
        router.push("/order");
    };

    // 4) If kiosk => show kiosk layout
    if (isKiosk) {
        return (
            <KioskContainer
                shopSlug={shopSlug}
                fulfillmentOptions={filteredFulfillment}
            />
        );
    }

    // 5) Otherwise normal layout
    const isDineIn = filteredFulfillment.some((f) => f.key === "dine-in");
    const isTakeaway = filteredFulfillment.some((f) => f.key === "takeaway");
    const isDelivery = filteredFulfillment.some((f) => f.key === "delivery");

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 overflow-x-hidden">
            <div className="flex grow items-stretch justify-center px-0 py-0 sm:px-8 sm:py-32 md:px-12 lg:px-16">
                <div
                    className="bg-white shadow-lg w-full max-w-screen-lg
          min-h-full sm:min-h-0
          sm:rounded-xl p-4 sm:p-8 lg:p-16
          flex flex-col justify-evenly"
                >
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                        {t("chooseMode.title")}
                    </h1>

                    <div className="flex flex-wrap justify-center gap-6">
                        {/* Dine In */}
                        <button
                            onClick={() => isDineIn && handleClickMethod("dine-in")}
                            disabled={!isDineIn || !!loadingMethod}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isDineIn ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className="relative w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32">
                                <Image
                                    src="/images/DineInIcon.png"
                                    alt="Dine In"
                                    fill
                                    className="object-contain"
                                // OPTIONAL: If you want Next to generate multiple sizes:
                                // sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, (max-width: 1024px) 128px, 100vw"
                                // priority or placeholder props as needed
                                />
                            </div>
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.dineIn.label")}
                            </h2>

                            {/* If loadingMethod is "dine-in", show spinner; else show normal hint */}
                            {loadingMethod === "dine-in" ? (
                                <div className="mt-1 flex items-center justify-center">
                                    <svg
                                        width="24"
                                        height="24"
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
                                <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                    {t("chooseMode.dineIn.hint")}
                                </p>
                            )}
                        </button>

                        {/* Takeaway */}
                        <button
                            onClick={() => isTakeaway && handleClickMethod("takeaway")}
                            disabled={!isTakeaway || !!loadingMethod}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isTakeaway ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className="relative w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32">
                                <Image
                                    src="/images/TakeAwayIcon.png"
                                    alt="Takeaway"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.takeAway.label")}
                            </h2>

                            {loadingMethod === "takeaway" ? (
                                <div className="mt-1 flex items-center justify-center">
                                    <svg
                                        width="24"
                                        height="24"
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
                                <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                    {t("chooseMode.takeAway.hint")}
                                </p>
                            )}
                        </button>

                        {/* Delivery */}
                        <button
                            onClick={() => isDelivery && handleClickMethod("delivery")}
                            disabled={!isDelivery || !!loadingMethod}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isDelivery ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <div className="relative w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32">
                                <Image
                                    src="/images/DeliveryIcon.png"
                                    alt="Delivery"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.delivery.label")}
                            </h2>

                            {loadingMethod === "delivery" ? (
                                <div className="mt-1 flex items-center justify-center">
                                    <svg
                                        width="24"
                                        height="24"
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
                                <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                    {t("chooseMode.delivery.hint")}
                                </p>
                            )}
                        </button>
                    </div>

                    <div className="mt-16 flex justify-center">
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </div>
    );

};
