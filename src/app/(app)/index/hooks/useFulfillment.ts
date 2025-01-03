"use client"

import { useEffect, useState } from "react"

export interface FulfillmentMethod {
    key: string
    label: string
    methodId: string
}

interface UseFulfillmentOptions {
    shopSlug: string
    excludeDelivery?: boolean
}

export function useFulfillment({ shopSlug, excludeDelivery }: UseFulfillmentOptions) {
    const [fulfillmentOptions, setFulfillmentOptions] = useState<FulfillmentMethod[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function fetchData() {
            try {
                setIsLoading(true)
                setError(null)

                const url = `/api/fulfillment?host=${shopSlug}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) {
                    throw new Error(`Fulfillment fetch failed with status ${res.status}`)
                }

                const rawData = await res.json()
                if (!Array.isArray(rawData)) {
                    throw new Error("Fulfillment data is not an array")
                }

                const mapped: FulfillmentMethod[] = rawData.map((item: any) => {
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

                const final = excludeDelivery
                    ? mapped.filter((f) => f.key !== "delivery")
                    : mapped

                if (isMounted) {
                    setFulfillmentOptions(final)
                    setIsLoading(false)
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.message ?? "Unknown error")
                    setFulfillmentOptions([])
                    setIsLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, [shopSlug, excludeDelivery])

    return { fulfillmentOptions, isLoading, error }
}
