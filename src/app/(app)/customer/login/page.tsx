import React from "react";
import { headers } from "next/headers";
import LoginLayout from "./components/LoginLayout";

/** 1) Helper to fetch branding from /api/getBranding?host=<slug> */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[LoginPage] Branding fetch error for host ${hostSlug} - status ${res.status}`);
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
            title: "MyShop - Login",
        };
    }

    // c) Use siteTitle if available
    const siteTitle = brandingData.branding.siteTitle || "MyShop";
    return {
        title: `${siteTitle} - Login`,
    };
}

/**
 * 3) Main server component
 *    – same pattern as /order/page.tsx and /customer/account/page.tsx
 */
export default async function LoginPage() {
    // a) Grab request headers => host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch branding
    const brandingData = await fetchBranding(hostSlug);

    // c) Render the client layout.
    //    If your root layout sets up ShopBrandingProvider globally, we just do:
    return <LoginLayout shopSlug={hostSlug} />;
}
