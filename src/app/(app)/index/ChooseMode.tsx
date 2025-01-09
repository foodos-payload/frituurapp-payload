"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/context/TranslationsContext";
import { useCart } from "@/context/CartContext";
import { KioskContainer } from "./components/kiosk/KioskContainer";

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
    const { setShippingMethod } = useCart();
    const searchParams = useSearchParams();

    // 1) Check `kiosk` param in client
    const kioskParam = searchParams.get("kiosk"); // "true" or null
    const isKiosk = kioskParam === "true";

    // 2) If kiosk => filter out "delivery"
    let filteredFulfillment = fulfillmentOptions;
    if (isKiosk) {
        filteredFulfillment = fulfillmentOptions.filter(
            (option) => option.key !== "delivery"
        );
    }

    useEffect(() => {
        // Could store kioskMode in localStorage if needed
        localStorage.setItem("kioskMode", String(isKiosk));
    }, [isKiosk]);

    // 3) Handle selecting a method
    const handleSelectOption = (optionKey: "dine-in" | "takeaway" | "delivery") => {
        const found = filteredFulfillment.find((f) => f.key === optionKey);
        if (!found) return;

        setShippingMethod(optionKey);
        router.push("/order");
    };

    // If you're using separate kiosk layout
    if (isKiosk) {
        return (
            <KioskContainer
                shopSlug={shopSlug}
                fulfillmentOptions={filteredFulfillment}
            />
        );
    }

    // 4) Otherwise normal mode
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
                            onClick={() => isDineIn && handleSelectOption("dine-in")}
                            disabled={!isDineIn}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border 
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isDineIn ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/DineInIcon.png"
                                alt="Dine In"
                                className="w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 object-contain"
                            />
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.dineIn.label")}
                            </h2>
                            <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                {t("chooseMode.dineIn.hint")}
                            </p>
                        </button>

                        {/* Takeaway */}
                        <button
                            onClick={() => isTakeaway && handleSelectOption("takeaway")}
                            disabled={!isTakeaway}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isTakeaway ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/TakeAwayIcon.png"
                                alt="Takeaway"
                                className="w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 object-contain"
                            />
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.takeAway.label")}
                            </h2>
                            <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                {t("chooseMode.takeAway.hint")}
                            </p>
                        </button>

                        {/* Delivery */}
                        <button
                            onClick={() => isDelivery && handleSelectOption("delivery")}
                            disabled={!isDelivery}
                            className={`flex flex-col items-center w-80 sm:w-52 p-4 border
              border-gray-200 bg-white shadow transition-transform hover:scale-105
              rounded-xl sm:rounded-xl
              ${!isDelivery ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/DeliveryIcon.png"
                                alt="Delivery"
                                className="w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 object-contain"
                            />
                            <h2 className="mt-2 sm:mt-4 text-xl sm:text-2xl font-semibold">
                                {t("chooseMode.delivery.label")}
                            </h2>
                            <p className="mt-1 text-gray-600 text-sm sm:text-md">
                                {t("chooseMode.delivery.hint")}
                            </p>
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
