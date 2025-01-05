// File: /src/app/(app)/index/ChooseMode.client.tsx
"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher"
import { useTranslation } from "@/context/TranslationsContext";


interface FulfillmentMethod {
    key: string
    label: string
    methodId: string
}

interface ChooseModeProps {
    shopSlug: string
    fulfillmentOptions: FulfillmentMethod[]  // pass from page.tsx
}

export const ChooseMode: React.FC<ChooseModeProps> = ({ shopSlug, fulfillmentOptions }) => {
    const router = useRouter()
    const { t } = useTranslation();

    // There's no more "isLoading", because we've done SSR fetch
    // And there's no more `useFulfillment`.

    useEffect(() => {
        localStorage.setItem("kioskMode", "false")
    }, [])

    const handleSelectOption = (optionKey: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === optionKey)
        if (!found) return
        localStorage.setItem("selectedShippingMethod", found.key)
        router.push("/order")
    }

    // Evaluate which modes are available
    const isDineIn = fulfillmentOptions.some((f) => f.key === "dine-in")
    const isTakeaway = fulfillmentOptions.some((f) => f.key === "takeaway")
    const isDelivery = fulfillmentOptions.some((f) => f.key === "delivery")

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <div className="flex justify-center items-center grow">
                <div className="bg-white shadow-lg rounded-xl p-8 max-w-screen-lg w-full">
                    <h1 className="text-3xl font-bold text-center mb-8">{t("chooseMode.title")}</h1>

                    <div className="flex flex-wrap justify-center gap-6">
                        {/* Dine In */}
                        <button
                            onClick={() => isDineIn && handleSelectOption("dine-in")}
                            disabled={!isDineIn}
                            className={`flex flex-col items-center w-60 h-60 p-4 border 
                border-gray-200 rounded-xl bg-white shadow
                hover:scale-105 transition-transform
                ${!isDineIn ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/DineInIcon.png"
                                alt="Dine In"
                                className="w-full h-24 object-contain"
                            />
                            <h2 className="mt-4 text-xl font-semibold">{t("chooseMode.dineIn.label")}</h2>
                            <p className="mt-1 text-gray-600 text-sm">{t("chooseMode.dineIn.hint")}</p>
                        </button>

                        {/* Takeaway */}
                        <button
                            onClick={() => isTakeaway && handleSelectOption("takeaway")}
                            disabled={!isTakeaway}
                            className={`flex flex-col items-center w-60 h-60 p-4 border 
                border-gray-200 rounded-xl bg-white shadow
                hover:scale-105 transition-transform
                ${!isTakeaway ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/TakeAwayIcon.png"
                                alt="Takeaway"
                                className="w-full h-24 object-contain"
                            />
                            <h2 className="mt-4 text-xl font-semibold">{t("chooseMode.takeAway.label")}</h2>
                            <p className="mt-1 text-gray-600 text-sm">{t("chooseMode.takeAway.hint")}</p>
                        </button>

                        {/* Delivery */}
                        <button
                            onClick={() => isDelivery && handleSelectOption("delivery")}
                            disabled={!isDelivery}
                            className={`flex flex-col items-center w-60 h-60 p-4 border 
                border-gray-200 rounded-xl bg-white shadow
                hover:scale-105 transition-transform
                ${!isDelivery ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <img
                                src="/images/DeliveryIcon.png"
                                alt="Delivery"
                                className="w-full h-24 object-contain"
                            />
                            <h2 className="mt-4 text-xl font-semibold">{t("chooseMode.delivery.label")}</h2>
                            <p className="mt-1 text-gray-600 text-sm">{t("chooseMode.delivery.hint")}</p>
                        </button>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </div>
    )
}
