// File: /src/app/(app)/index/components/kiosk/KioskContainer.tsx
"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "../../../../components/LanguageSwitcher/LanguageSwitcher"
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
    const router = useRouter()

    // Mark kiosk mode in localStorage
    useEffect(() => {
        localStorage.setItem("kioskMode", "true")
    }, [])

    const selectOption = (key: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === key)
        if (!found) return
        localStorage.setItem("selectedShippingMethod", found.methodId)
        router.push("/bestellen")
    }

    return (
        <div className="flex flex-col h-[100vh]">
            <KioskAppHeaderHome
                siteTitle={branding.siteTitle ?? "My Kiosk Site"}
                siteHeaderImg={branding.siteHeaderImg ?? "/images/defaultHeader.jpg"}
            />

            {/* Show your kiosk UI */}
            <div className="flex flex-col justify-end grow">
                <div className="flex flex-col justify-end items-end min-h-full bg-white">
                    <div
                        className="flex flex-col justify-stretch items-center kiosk-choose-container
              bg-white rounded-lg p-8 w-full h-full"
                    >
                        <div>
                            <h1 className="text-9xl font-bold text-center mt-40 uppercase">Decide</h1>
                            {/* etc. ... */}
                        </div>

                        <div className="flex flex-col justify-center mt-20 kiosk-options gap-8 mb-16">
                            {fulfillmentOptions.map((f) => (
                                <div
                                    key={f.methodId}
                                    onClick={() => selectOption(f.key as "dine-in" | "takeaway" | "delivery")}
                                    className="kiosk-option border border-gray-200 rounded-lg p-8 w-full 
                    cursor-pointer transition-transform transform hover:scale-105 
                    shadow-md text-center max-w-[400px] bg-[#ffffffa8]"
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
                                        className="kiosk-option-image w-full h-64 object-contain"
                                    />
                                    <h2 className="kiosk-option-h2 mt-8 text-3xl font-semibold">{f.label}</h2>
                                    <p className="kiosk-option-p mt-4 text-2xl text-gray-600">
                                        {f.key === "dine-in"
                                            ? "Enjoy your meal on-site"
                                            : f.key === "takeaway"
                                                ? "Pick up your order"
                                                : "We bring it to you"}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col justify-between">
                            <div className="w-full flex justify-center mb-6 mt-80">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
