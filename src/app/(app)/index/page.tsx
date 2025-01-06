// File: /src/app/(app)/index/page.tsx

import React from "react"
import { headers } from "next/headers"
import { KioskContainer } from "./components/kiosk/KioskContainer"
import { ChooseMode } from "./ChooseMode"

export const dynamic = "force-dynamic"

interface FulfillmentMethod {
    key: string
    label: string
    methodId: string
}
interface BrandingData {
    siteTitle?: string
    siteHeaderImg?: string
}

export default async function IndexPage(context: any) {
    const searchParams = context?.searchParams || {}
    const isKiosk = searchParams.kiosk === "true"

    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"


    const fulfillmentUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${hostSlug}`
    const fulfillmentRes = await fetch(fulfillmentUrl, { cache: "no-store" })
    let fulfillmentOptions: FulfillmentMethod[] = []
    if (fulfillmentRes.ok) {
        const data = await fulfillmentRes.json()

        fulfillmentOptions = Array.isArray(data)
            ? data.map((item: any) => {
                const { method_type, id } = item
                // Turn method_type into a key/label
                switch (method_type) {
                    case "dine_in":
                        return { key: "dine-in", label: "Dine In", methodId: id }
                    case "takeaway":
                        return { key: "takeaway", label: "Takeaway", methodId: id }
                    case "delivery":
                        return { key: "delivery", label: "Delivery", methodId: id }
                    default:
                        return { key: method_type, label: method_type, methodId: id }
                }
            })
            : []
    }

    let brandingData: BrandingData = {}
    if (isKiosk) {
        const brandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`
        const brandingRes = await fetch(brandingUrl, { cache: "no-store" })
        if (brandingRes.ok) {
            const brandingJSON = await brandingRes.json()
            if (brandingJSON?.branding) {
                brandingData = {
                    siteTitle: brandingJSON.branding.siteTitle ?? "My Kiosk Site",
                    siteHeaderImg:
                        brandingJSON.branding.siteHeaderImg?.s3_url || "/images/defaultHeader.jpg",
                }
            }
        }
    }

    // 3) Render either kiosk or normal:
    if (isKiosk) {
        return (
            <KioskContainer
                shopSlug={hostSlug}
                fulfillmentOptions={fulfillmentOptions}
                branding={brandingData}
            />
        )
    }

    return <ChooseMode shopSlug={hostSlug} fulfillmentOptions={fulfillmentOptions} />
}
