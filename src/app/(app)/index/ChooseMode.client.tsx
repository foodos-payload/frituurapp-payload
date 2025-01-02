"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface FulfillmentMethod {
    key: string
    label: string
    methodId: string
}

interface ChooseModeProps {
    tenantSlug: string
    shopSlug: string
}

export const ChooseMode: React.FC<ChooseModeProps> = ({ tenantSlug, shopSlug }) => {
    // States
    const [isLoading, setIsLoading] = useState(true)
    const [isSkeleton, setIsSkeleton] = useState(true)
    const [dineInKioskOnly, setDineInKioskOnly] = useState(false)
    const [fulfillmentOptions, setFulfillmentOptions] = useState<FulfillmentMethod[]>([])
    const [hasDelivery, setHasDelivery] = useState(false)

    const router = useRouter()

    // On mount
    useEffect(() => {
        // 1. Read environment var for kiosk-only
        setDineInKioskOnly(process.env.NEXT_PUBLIC_DINEIN_KIOSK_ONLY === "true")

        // 2. Mark kiosk mode as false
        localStorage.setItem("kioskMode", "false")

        // 3. Turn off skeleton quickly
        setTimeout(() => setIsSkeleton(false), 100)

        // 4. Fetch fulfillment for this shopSlug
        fetchFulfillment().then(() => setIsLoading(false))

        // 5. Optional: clear cart / prefetch products, etc.
    }, [shopSlug])

    // (C) Fetch the local fulfillment data
    const fetchFulfillment = async () => {
        try {
            const res = await fetch("/api/fulfillment", { cache: "no-store" })
            const rawData = await res.json()
            if (!Array.isArray(rawData)) {
                console.warn("Fulfillment data not an array:", rawData)
                return
            }

            // Filter to only those that contain a shop with matching slug
            const filtered = rawData.filter((item: any) =>
                item.shops?.some((shop: any) => shop.slug === shopSlug)
            )

            // Transform them into your desired shape
            const transformed = filtered.map((item: any) => {
                const { method_type, id } = item
                let key = ""
                let label = ""

                switch (method_type) {
                    case "dine_in":
                        key = "dine-in"
                        label = "Dine In"
                        break
                    case "takeaway":
                        key = "takeaway"
                        label = "Takeaway"
                        break
                    case "delivery":
                        key = "delivery"
                        label = "Delivery"
                        break
                    default:
                        key = method_type
                        label = method_type
                }

                return {
                    key,
                    label,
                    methodId: id,
                }
            })

            setFulfillmentOptions(transformed)

            // If logic says "delivery is available" if there's "delivery" in the result
            setHasDelivery(transformed.some((f) => f.key === "delivery"))
        } catch (error) {
            console.error("Error fetching fulfillment:", error)
            setFulfillmentOptions([])
            setHasDelivery(false)
        }
    }

    // (D) Handle user selection
    const handleSelectOption = (optionKey: "dine-in" | "takeaway" | "delivery") => {
        // 1. Find the method ID from the array
        const foundMethod = fulfillmentOptions.find((f) => f.key === optionKey)
        if (!foundMethod) {
            console.warn(`Fulfillment method not found for: ${optionKey}`)
            return
        }

        const { methodId } = foundMethod

        // 2. Store shipping method
        localStorage.setItem("selectedShippingMethod", methodId)

        // 3. Redirect to /bestellen
        router.push(`/bestellen`)
    }

    // Evaluate which modes are available
    const isDineIn = fulfillmentOptions.some((f) => f.key === "dine-in")
    const isTakeaway = fulfillmentOptions.some((f) => f.key === "takeaway")
    const isDelivery = fulfillmentOptions.some((f) => f.key === "delivery")

    // Skeleton loading UI
    if (isSkeleton) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-screen-lg w-full text-center">
                    <h1 className="text-3xl font-bold my-4">Loading modes...</h1>
                    <div className="flex flex-wrap justify-center gap-4 mt-10">
                        <div className="animate-pulse w-40 h-40 bg-gray-300 rounded-md" />
                        <div className="animate-pulse w-40 h-40 bg-gray-300 rounded-md" />
                        <div className="animate-pulse w-40 h-40 bg-gray-300 rounded-md" />
                    </div>
                </div>
            </div>
        )
    }

    // Main UI
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <div className="flex justify-center items-center grow">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-screen-lg w-full">
                    <h1 className="text-3xl font-bold text-center mb-8">Choose Your Mode</h1>

                    <div className="flex flex-wrap justify-center gap-6">
                        {/* Dine-In (only if NOT kiosk-only) */}
                        {!dineInKioskOnly && (
                            <button
                                onClick={() => isDineIn && handleSelectOption("dine-in")}
                                disabled={isLoading || !isDineIn}
                                className={`flex flex-col items-center w-48 h-56 p-4 border 
                  border-gray-200 rounded-md bg-white shadow
                  hover:scale-105 transition-transform
                  ${(!isDineIn || isLoading) ? "opacity-50 cursor-not-allowed" : ""}
                `}
                            >
                                <img
                                    src="/images/DineInIcon.png"
                                    alt="Dine In"
                                    className="w-full h-24 object-contain"
                                />
                                <h2 className="mt-4 text-xl font-semibold">Dine In</h2>
                                <p className="mt-1 text-gray-600 text-sm">Enjoy your meal on-site</p>
                            </button>
                        )}

                        {/* Takeaway */}
                        <button
                            onClick={() => isTakeaway && handleSelectOption("takeaway")}
                            disabled={isLoading || !isTakeaway}
                            className={`flex flex-col items-center w-48 h-56 p-4 border 
                border-gray-200 rounded-md bg-white shadow
                hover:scale-105 transition-transform
                ${(!isTakeaway || isLoading) ? "opacity-50 cursor-not-allowed" : ""}
              `}
                        >
                            <img
                                src="/images/TakeAwayIcon.png"
                                alt="Takeaway"
                                className="w-full h-24 object-contain"
                            />
                            <h2 className="mt-4 text-xl font-semibold">Takeaway</h2>
                            <p className="mt-1 text-gray-600 text-sm">Pick up your order</p>
                        </button>

                        {/* Delivery (always displayed, but disabled if not in fulfillment array) */}
                        <button
                            onClick={() => isDelivery && handleSelectOption("delivery")}
                            disabled={isLoading || !isDelivery}
                            className={`flex flex-col items-center w-48 h-56 p-4 border 
                border-gray-200 rounded-md bg-white shadow 
                hover:scale-105 transition-transform
                ${(!isDelivery || isLoading) ? "opacity-50 cursor-not-allowed" : ""}
              `}
                        >
                            <img
                                src="/images/DeliveryIcon.png"
                                alt="Delivery"
                                className="w-full h-24 object-contain"
                            />
                            <h2 className="mt-4 text-xl font-semibold">Delivery</h2>
                            <p className="mt-1 text-gray-600 text-sm">We bring it to you</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
