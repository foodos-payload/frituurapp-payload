"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher"
import { useTranslation } from "@/context/TranslationsContext"
import { KioskAppHeaderHome } from "./KioskAppHeaderHome"

interface FulfillmentMethod {
    key: string
    label: string
    methodId: string
}
interface BrandingData {
    siteTitle?: string
    siteHeaderImg?: string
}

interface KioskContainerProps {
    shopSlug: string
    fulfillmentOptions: FulfillmentMethod[]
    branding: BrandingData
}

export const KioskContainer: React.FC<KioskContainerProps> = ({
    shopSlug,
    fulfillmentOptions,
    branding,
}) => {
    const { t } = useTranslation()
    const router = useRouter()

    useEffect(() => {
        localStorage.setItem("kioskMode", "true")
    }, [])

    const selectOption = (key: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === key)
        if (!found) return
        localStorage.setItem("selectedShippingMethod", found.methodId)
        router.push("/order?kiosk=true")
    }

    return (
        <div className="flex flex-col h-[100vh] overflow-hidden">
            {/* Header (top) */}
            <KioskAppHeaderHome
                siteTitle={branding.siteTitle ?? "My Kiosk Site"}
                siteHeaderImg={branding.siteHeaderImg ?? "/images/defaultHeader.jpg"}
            />

            {/* Main content (center) */}
            <div className="flex flex-col flex-1 items-center justify-center bg-white px-8 py-4">
                <h1 className="text-7xl font-bold text-center uppercase mt-4">{t("chooseMode.title")}</h1>

                {/* Fulfillment options */}
                <div className="flex flex-wrap justify-center gap-8 mt-12">
                    {fulfillmentOptions.map((f) => (
                        <div
                            key={f.methodId}
                            onClick={() => selectOption(f.key as "dine-in" | "takeaway" | "delivery")}
                            className="border border-gray-200 rounded-xl p-8 w-full max-w-[300px]
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
                            <h2 className="mt-4 text-3xl font-semibold">
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
            <div className="flex justify-center items-center py-10">
                <LanguageSwitcher />
            </div>
        </div>
    )
}
