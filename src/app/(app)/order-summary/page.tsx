// File: /src/app/(app)/order-summary/page.tsx
import React from "react";
import { headers } from "next/headers";
import { OrderSummaryPage } from "./OrderSummaryPage.client";

export const dynamic = "force-dynamic";

export default async function OrderSummaryPageRoute({
    searchParams: promiseSearchParams,
}: {
    searchParams: Promise<{
        orderId?: string;
        kiosk?: string;
    }>;
}) {
    // 1) Extract query params
    const { orderId = "999", kiosk = "" } = await promiseSearchParams;
    const kioskMode = kiosk === "true";

    // 2) Derive the host slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 3) Build the branding endpoint
    const brandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    // 4) Also build the fulfillment endpoint
    const fulfillmentUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${hostSlug}`;

    // 5) Fetch both in parallel
    const [brandingRes, fulfillmentRes] = await Promise.all([
        fetch(brandingUrl, { cache: "no-store" }),
        fetch(fulfillmentUrl, { cache: "no-store" }),
    ]);

    // 6) Parse branding
    let brandingData: any = {};
    if (brandingRes.ok) {
        const brandingJSON = await brandingRes.json();
        brandingData = brandingJSON?.branding ?? {};
    }

    // 7) Shape the branding object
    const branding = {
        logoUrl: brandingData?.siteLogo?.s3_url ?? "",
        adImage: brandingData?.adImage?.s3_url ?? "",
        headerBackgroundColor: brandingData?.headerBackgroundColor ?? "",
        categoryCardBgColor: brandingData?.categoryCardBgColor ?? "",
        primaryColorCTA: brandingData?.primaryColorCTA ?? "",
        siteTitle: brandingData?.siteTitle ?? "",
        siteHeaderImg: brandingData?.siteHeaderImg?.s3_url ?? "",
        tripAdvisorUrl: brandingData?.tripAdvisorUrl ?? "",
        googleReviewUrl: brandingData?.googleReviewUrl ?? "",
    };

    // 8) Parse fulfillment array
    let fulfillments: any[] = [];
    if (fulfillmentRes.ok) {
        const data = await fulfillmentRes.json(); // returns array
        if (Array.isArray(data)) {
            fulfillments = data;
        }
    }

    // 9) Render the page: pass orderId, kioskMode, hostSlug,
    //    plus branding & fulfillments
    return (
        <main className="bg-white text-gray-800 flex justify-center items-center min-h-screen">
            <OrderSummaryPage
                orderId={orderId}
                kioskMode={kioskMode}
                hostSlug={hostSlug}
                branding={branding}
                fulfillments={fulfillments}
            />
        </main>
    );
}