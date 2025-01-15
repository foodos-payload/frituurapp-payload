// File: /src/app/(app)/order-summary/page.tsx
import React from "react";
import { headers } from "next/headers";
import { OrderSummaryPage } from "./OrderSummaryPage.client";

export const dynamic = "force-dynamic";

/** Minimal helper to fetch branding so we can get the shop's siteTitle. */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${encodeURIComponent(hostSlug)}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(
            `[OrderSummaryPageRoute] Branding fetch error for host ${hostSlug} - status ${res.status}`
        );
        return null;
    }
    return res.json(); // => { shop: {...}, branding: {...} }
}

/**
 * Next.js 13 "generateMetadata()" function to create the <title>, etc.
 */
export async function generateMetadata() {
    // 1) Determine the shop slug from headers
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        // Fallback
        return {
            title: "MyShop - Order Summary",
        };
    }

    // 3) Grab siteTitle, fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    // 4) Return the final metadata object
    return {
        title: `${siteTitle} - Order Summary`,
    };
}

/**
 * The main server component for /order-summary:
 *  - Reads searchParams, hostSlug
 *  - Fetches data as needed (fulfillment, etc.)
 *  - Renders the client component <OrderSummaryPage/>
 */
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

    // 3) Build the fulfillment endpoint
    const fulfillmentUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${hostSlug}`;

    // 4) Fetch needed data
    const [fulfillmentRes] = await Promise.all([
        fetch(fulfillmentUrl, { cache: "no-store" }),
    ]);

    // 5) Parse fulfillment array
    let fulfillments: any[] = [];
    if (fulfillmentRes.ok) {
        const data = await fulfillmentRes.json(); // returns array
        if (Array.isArray(data)) {
            fulfillments = data;
        }
    }

    // 6) Render the client component
    return (
        <main className="bg-white text-gray-800 flex justify-center items-center min-h-screen">
            <OrderSummaryPage
                orderId={orderId}
                kioskMode={kioskMode}
                hostSlug={hostSlug}
                fulfillments={fulfillments}
            />
        </main>
    );
}
