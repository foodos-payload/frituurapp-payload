// File: /app/terms-and-conditions/page.tsx

import React from "react";
import { headers } from "next/headers";
import TermsAndConditionsPage from "./components/TermsAndConditionsPage";

/**
 * Minimal fetcher for branding (like you did in the PrivacyPolicy example).
 */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(`[TermsPage] Branding fetch error for host ${hostSlug}, status ${res.status}`);
        return null;
    }
    return res.json();
}

/**
 * Next.js 13 "generateMetadata()" function.
 * We'll create a <title> like "MyShop - Terms and Conditions",
 * or fallback if branding is missing.
 */
export async function generateMetadata() {
    // 1) Grab host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        return {
            title: "MyShop - Terms and Conditions",
        };
    }

    // 3) siteTitle fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Terms and Conditions`,
    };
}

/**
 * The main page function that fetches + transforms branding data
 * and renders your client component <TermsAndConditionsPage />.
 */
export default async function TermsServerPage() {
    // 1) Host => slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch from your branding endpoint
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const brandingRes = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!brandingRes.ok) {
        console.error(
            `[TermsPage] Could not load branding for host: ${hostSlug} – status ${brandingRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load branding for host: {hostSlug}</h2>
            </div>
        );
    }

    // 3) Parse JSON => { shop: {...}, branding: {...} }
    const brandingData = await brandingRes.json();
    const shopData = brandingData.shop || null;
    const brandDoc = brandingData.branding || null;

    // 4) Transform brandDoc images (like your pattern):
    if (brandDoc?.siteHeaderImg?.s3_url) {
        brandDoc.siteHeaderImg = brandDoc.siteHeaderImg.s3_url;
    }
    if (brandDoc?.siteLogo?.s3_url) {
        brandDoc.logoUrl = brandDoc.siteLogo.s3_url;
    }
    if (Array.isArray(brandDoc?.galleryImages)) {
        brandDoc.galleryImages.forEach((galleryItem: any) => {
            const img = galleryItem.image;
            if (img?.s3_url) {
                img.url = img.s3_url;
            }
        });
    }

    // 5) Render the client component, passing shopData + brandDoc
    return (
        <TermsAndConditionsPage
            shopData={shopData}
            brandingData={brandDoc}
        />
    );
}
