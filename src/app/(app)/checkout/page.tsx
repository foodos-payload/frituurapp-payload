// File: /src/app/(app)/checkout/page.tsx
import React from "react";
import { headers } from "next/headers";
import CheckoutPage from "./components/CheckoutPage";

export const dynamic = "force-dynamic";

/**
 * 1) A helper to fetch just enough branding to read siteTitle
 */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[CheckoutRoute] Branding fetch error for host ${hostSlug} - status ${res.status}`);
        return null;
    }
    return res.json(); // => { shop: {...}, branding: {...} }
}

/**
 * 2) Next.js 13 "generateMetadata()" for this route:
 *    We'll produce "ShopName - Checkout" or fallback "MyShop - Checkout".
 */
export async function generateMetadata() {
    // a) Determine host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        // fallback
        return { title: "MyShop - Checkout" };
    }

    // c) Use siteTitle, fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Checkout`,
    };
}

/**
 * 3) Main function that fetches Payment Methods, Timeslots, Shop Info, etc.
 *    Then renders the <CheckoutPage /> client component.
 */
export default async function CheckoutRoute() {
    const headersList = await headers();
    const fullHost = headersList.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 1) Payment Methods
    let paymentMethods = [];
    try {
        const paymentRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getPaymentMethods?host=${encodeURIComponent(hostSlug)}`,
            { cache: "no-store" }
        );
        if (paymentRes.ok) {
            const data = await paymentRes.json();
            paymentMethods = data?.methods || [];
        }
    } catch (err) {
        console.error("Error fetching payment methods:", err);
    }

    // 2) Timeslots
    let timeslots = [];
    try {
        const tsRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getTimeslots?host=${encodeURIComponent(hostSlug)}`,
            { cache: "no-store" }
        );
        if (tsRes.ok) {
            const data = await tsRes.json();
            timeslots = data?.timeslots || [];
        }
    } catch (err) {
        console.error("Error fetching timeslots:", err);
    }

    // 3) Shop info => lat/lng
    let shopInfo = null;
    try {
        const shopsRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getShop?host=${encodeURIComponent(hostSlug)}`,
            { cache: "no-store" }
        );
        const data = await shopsRes.json();
        shopInfo = data?.shop || null;
    } catch (err) {
        console.error("Error fetching shop info:", err);
    }

    // 4) Fulfillment info => /api/getFulFillment
    let fulfillmentMethods = [];
    try {
        const fmRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${encodeURIComponent(hostSlug)}`,
            { cache: "no-store" }
        );
        if (fmRes.ok) {
            fulfillmentMethods = await fmRes.json();
        }
    } catch (err) {
        console.error("Error fetching fulfillment methods:", err);
    }

    // 5) Tipping config
    let tippingMethods = [];
    try {
        const tmRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getTippingConfig?host=${encodeURIComponent(hostSlug)}`,
            { cache: "no-store" }
        );
        if (tmRes.ok) {
            tippingMethods = await tmRes.json();
        }
    } catch (err) {
        console.error("Error fetching tipping config:", err);
    }

    // 6) Render the CheckoutPage client component
    return (
        <main className="min-h-screen">
            <CheckoutPage
                hostSlug={hostSlug}
                initialPaymentMethods={paymentMethods}
                initialTimeslots={timeslots}
                shopInfo={shopInfo}
                fulfillmentMethods={fulfillmentMethods}
                tippingMethods={tippingMethods}
            />
        </main>
    );
}
