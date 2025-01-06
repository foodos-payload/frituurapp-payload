// File: /src/app/(app)/order-summary/page.tsx
import React from "react"
import { headers } from "next/headers"
import { OrderSummaryPage } from "./OrderSummaryPage.client"

export const dynamic = "force-dynamic"

export default async function OrderSummaryPageRoute({
    searchParams: promiseSearchParams,
}: {
    searchParams: Promise<{
        orderId?: string
        kiosk?: string
    }>
}) {
    // 1) Extract query params (orderId, kiosk, etc.)
    const { orderId = "999", kiosk = "" } = await promiseSearchParams
    const kioskMode = kiosk === "true"

    // 2) Derive host slug
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get("host") || ""
    const hostSlug = fullHost.split(".")[0] || "defaultShop"

    // 3) Build the branding endpoint
    const brandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`

    // 4) Fetch branding
    const brandingRes = await fetch(brandingUrl, { cache: "no-store" })
    let brandingData: any = {}
    if (brandingRes.ok) {
        brandingData = await brandingRes.json()
    }

    // 5) Shape the branding object
    //    You can adapt these fields to match your "branding" usage
    const rawBranding = brandingData?.branding || {}
    const branding = {
        logoUrl: rawBranding.siteLogo?.s3_url ?? "",
        adImage: rawBranding.adImage?.s3_url ?? "",
        headerBackgroundColor: rawBranding.headerBackgroundColor ?? "",
        categoryCardBgColor: rawBranding.categoryCardBgColor ?? "",
        primaryColorCTA: rawBranding.primaryColorCTA ?? "",
        siteTitle: rawBranding.siteTitle ?? "",
        siteHeaderImg: rawBranding.siteHeaderImg?.s3_url ?? "",
    }

    // 6) Render the page and pass branding + other props
    return (
        <main className="bg-white text-gray-800 flex justify-center items-center h-screen">
            <OrderSummaryPage
                orderId={orderId}
                kioskMode={kioskMode}
                hostSlug={hostSlug}
                branding={branding}
            />
        </main>
    )
}
