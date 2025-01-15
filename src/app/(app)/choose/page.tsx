// File: /src/app/(app)/choose/page.tsx

import React from "react";
import { headers } from "next/headers";
import { KioskContainer } from "./components/kiosk/KioskContainer";
import { ChooseMode } from "./ChooseMode";

/** 
 * 1) A small helper to fetch the branding 
 *    so we can read siteTitle in generateMetadata().
 */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[ChoosePage] Could not load branding for host: ${hostSlug} - status ${res.status}`);
        return null;
    }
    return res.json();
}

/**
 * 2) Next.js 13 "generateMetadata" for setting <title>, etc.
 *    We'll produce e.g. "MyShop - Choose how you want to order"
 */
export async function generateMetadata() {
    // a) Determine host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        return {
            title: "MyShop - Choose how you want to order",
        };
    }
    // c) siteTitle fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Choose how you want to order`,
    };
}

/**
 * 3) The main page function that fetches fulfillment options,
 *    then returns the client component <ChooseMode>.
 */
export default async function IndexPage() {
    // 1) Get host info
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch fulfillment options
    const fulfillmentUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${hostSlug}`;
    const fulfillmentRes = await fetch(fulfillmentUrl, { cache: "no-store" });

    let fulfillmentOptions: any[] = [];
    if (fulfillmentRes.ok) {
        const data = await fulfillmentRes.json();
        if (Array.isArray(data)) {
            fulfillmentOptions = data.map((item: any) => {
                const { method_type, id } = item;
                switch (method_type) {
                    case "dine_in":
                        return { key: "dine-in", label: "Dine In", methodId: id };
                    case "takeaway":
                        return { key: "takeaway", label: "Takeaway", methodId: id };
                    case "delivery":
                        return { key: "delivery", label: "Delivery", methodId: id };
                    default:
                        return { key: method_type, label: method_type, methodId: id };
                }
            });
        }
    }

    // 3) Return the client component
    return (
        <ChooseMode
            shopSlug={hostSlug}
            fulfillmentOptions={fulfillmentOptions}
        />
    );
}
