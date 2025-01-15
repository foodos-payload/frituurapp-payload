// File: /app/(app)/order/page.tsx
import React from "react";
import { headers } from "next/headers";
import OrderLayout from "./components/OrderLayout";

/** 1) A helper to fetch branding, so we can read siteTitle in generateMetadata. */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[OrderPage] Branding fetch error for host ${hostSlug} - status ${res.status}`);
        return null;
    }
    return res.json(); // => { shop: {...}, branding: {...} }
}

/** 
 * 2) Next.js 13 "generateMetadata()" for the /order page.
 *    We'll produce e.g. "ShopName - Ordering".
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
        return {
            title: "MyShop - Ordering",
        };
    }

    // c) Use siteTitle, fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Ordering`,
    };
}

/**
 * 3) Main page function, which fetches products and renders <OrderLayout>.
 */
export default async function OrderPage() {
    // 1) Grab request headers => host
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Build API endpoints
    const apiProductsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}`;

    // 3) Fetch data
    const productsRes = await fetch(apiProductsUrl, { cache: "no-store" });

    if (!productsRes.ok) {
        console.error(
            `[OrderPage] Could not load products for host: ${hostSlug} – status ${productsRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load products for host: {hostSlug}</h2>
            </div>
        );
    }

    // 4) Parse JSON
    const productsData = await productsRes.json();
    const categorizedProducts = productsData?.categorizedProducts || [];

    // You can optionally log:
    // console.log(`[OrderPage] raw productsData:`, productsData);
    // console.log(`[OrderPage] categorizedProducts:`, categorizedProducts);

    // Sort categories by menuOrder, then by name
    categorizedProducts.sort((a: any, b: any) => {
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder;
        }
        return a.name_nl.localeCompare(b.name_nl);
    });

    // 5) Render your layout
    return (
        <OrderLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
        />
    );
}
