"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFulfillment } from "../../hooks/useFulfillment"
import { useBranding } from "../../hooks/useBranding"
import { LanguageSwitcher } from "../LanguageSwitcher"

import { KioskAppHeaderHome } from "./KioskAppHeaderHome"

interface KioskContainerProps {
    shopSlug: string
}

export const KioskContainer: React.FC<KioskContainerProps> = ({ shopSlug }) => {
    const router = useRouter()

    // 1) We call our new hook, excluding “delivery”
    const { fulfillmentOptions, isLoading: isFulfillLoading } = useFulfillment({
        shopSlug,
        excludeDelivery: true,
    })

    const { branding, isLoading: isBrandingLoading } = useBranding({
        shopSlug,
    })

    // 2) In kiosk mode, set kiosk in localStorage
    useEffect(() => {
        localStorage.setItem("kioskMode", "true")
        // Possibly do other kiosk stuff
    }, [])

    const isLoading = isFulfillLoading || isBrandingLoading

    // 3) A small function for selecting shipping
    const selectOption = (key: "dine-in" | "takeaway" | "delivery") => {
        const found = fulfillmentOptions.find((f) => f.key === key)
        if (!found) return
        localStorage.setItem("selectedShippingMethod", found.methodId)
        router.push("/bestellen")
    }

    // 4) If isLoading => kiosk skeleton
    if (isLoading) {
        return (
            <div className="flex flex-col h-[100vh]">
                {/* Skeleton similar to your old code */}
                <div className="mb-10">
                    <div className="bg-gray-200 h-60 bg-cover bg-center relative">
                        <div className="absolute top-[20%] left-2 animate-pulse bg-gray-300 w-3/4 h-16 rounded" />
                    </div>
                </div>

                <div className="flex flex-col justify-end grow">
                    <div className="flex flex-col items-center h-full bg-white p-4">
                        <div className="w-full h-full flex flex-col justify-between items-center gap-8">
                            <div className="skeleton-pulse w-3/4 h-16 rounded mb-8 mt-40 bg-gray-300" />

                            <div className="w-[75%] flex flex-row gap-8 mb-40">
                                <div className="kiosk-skeleton-option skeleton-pulse bg-gray-300 w-full h-[450px] rounded-lg" />
                                <div className="kiosk-skeleton-option skeleton-pulse bg-gray-300 w-full h-[450px] rounded-lg" />
                            </div>

                            <div className="w-full flex flex-col justify-center items-center mt-60">
                                <div className="skeleton-pulse bg-gray-300 h-32 w-2/4 rounded mb-10" />
                                <div className="skeleton-pulse bg-gray-300 h-20 w-3/4 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 5) If not loading => show kiosk UI
    //    We only show "dine-in" and "takeaway" because we excluded "delivery"
    return (
        <div className="flex flex-col h-[100vh]">
            <KioskAppHeaderHome
                siteTitle={branding.siteTitle}
                siteHeaderImg={branding.siteHeaderImg}
            />

            <div className="flex flex-col justify-end grow">
                <div className="flex flex-col justify-end items-end min-h-full bg-white">
                    <div className="flex flex-col justify-stretch items-center kiosk-choose-container
             bg-white rounded-lg p-8 w-full h-full"
                    >
                        <div>
                            <h1 className="text-9xl font-bold text-center mt-40 uppercase">
                                Decide
                            </h1>
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
                                                : "/images/TakeAwayIcon.png"
                                        }
                                        alt={f.label}
                                        className="kiosk-option-image w-full h-64 object-contain"
                                    />
                                    <h2 className="kiosk-option-h2 mt-8 text-3xl font-semibold">
                                        {f.label}
                                    </h2>
                                    <p className="kiosk-option-p mt-4 text-2xl text-gray-600">
                                        {f.key === "dine-in"
                                            ? "Enjoy your meal on-site"
                                            : "Pick up your order"}
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
