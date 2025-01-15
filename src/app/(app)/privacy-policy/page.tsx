// File: /app/privacy-policy/page.tsx

import React from "react";
import { headers } from "next/headers";
import PrivacyPolicy from "./components/PrivacyPolicy";

/** 
 * 1) We define a minimal function to fetch branding for our `generateMetadata()` 
 *    (You can also factor this out into a shared helper if you wish.)
 */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[PrivacyPolicy] Branding fetch error for host ${hostSlug}, status ${res.status}`);
        return null;
    }
    return res.json();
}

/** 
 * 2) Next.js 13 "generateMetadata()" function. 
 *    - Runs on the server to produce <title>, <meta>, icons, etc.
 *    - Must be exported in the same file as the page component.
 */
export async function generateMetadata() {
    // a) Determine the shop slug from Host
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // b) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        // fallback
        return {
            title: `MyShop - Privacy Policy`,
            description: `Privacy policy page for MyShop.`,
        };
    }

    // c) Grab the siteTitle (fallback "MyShop") 
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Privacy Policy`,
    };
}

/**
 * 3) The main page component for privacy policy content.
 */
export default async function PrivacyPolicyPage() {
    // 1) Grab request headers to get the "host"
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Build the branding URL
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;

    // 3) Fetch branding data
    const brandingRes = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!brandingRes.ok) {
        console.error(
            `[PrivacyPolicyPage] Could not load branding for host: ${hostSlug} – status ${brandingRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load branding for host: {hostSlug}</h2>
            </div>
        );
    }

    const brandingData = await brandingRes.json();
    const shopData = brandingData.shop || null;
    const brandDoc = brandingData.branding || null;

    // 4) Transform brandDoc images (like your existing approach)
    if (brandDoc?.siteHeaderImg?.s3_url) {
        brandDoc.siteHeaderImg = brandDoc.siteHeaderImg.s3_url;
    }
    if (brandDoc?.siteLogo?.s3_url) {
        brandDoc.logoUrl = brandDoc.siteLogo.s3_url;
    }
    if (Array.isArray(brandDoc?.galleryImages)) {
        brandDoc.galleryImages.forEach((galleryItem: any) => {
            if (galleryItem.image?.s3_url) {
                galleryItem.image.url = galleryItem.image.s3_url;
            }
        });
    }

    // 5) Return the client component (PrivacyPolicy), passing shopData + brandDoc
    return (
        <PrivacyPolicy
            shopData={shopData}
            brandingData={brandDoc}
        />
    );
}
