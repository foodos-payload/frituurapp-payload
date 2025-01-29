import React from "react";
import { headers } from "next/headers";
import AccountLayout from "./components/AccountLayout";

/** 1) Helper to fetch branding from /api/getBranding?host=<slug> */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(
            `[AccountPage] Branding fetch error for host ${hostSlug} - status ${res.status}`
        );
        return null;
    }
    return res.json(); // => { shop, branding }
}

/** 2) (Optional) Use generateMetadata() for dynamic <title> */
export async function generateMetadata() {
    // a) Determine host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        return {
            title: "MyShop - My Account",
        };
    }

    // c) Use siteTitle if available
    const siteTitle = brandingData.branding.siteTitle || "MyShop";
    return {
        title: `${siteTitle} - My Account`,
    };
}

/** 
 * 3) Main server component 
 *    – same style as /order/page.tsx
 */
export default async function AccountPage() {
    // a) Grab request headers => host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch branding
    const brandingData = await fetchBranding(hostSlug);
    const shopData = brandingData.shop || null;

    // c) Render your client layout with the shopSlug
    //    (We assume your root layout or another provider sets up ShopBrandingProvider globally.
    //     If not, you could pass `branding` as a prop here, but let's assume it's handled globally.)
    return (
        <AccountLayout shopSlug={hostSlug} shopData={shopData} />
    );
}
