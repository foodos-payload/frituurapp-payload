import React from "react";
import { headers } from "next/headers";
import TermsAndConditionsPage from "./components/TermsAndConditionsPage";

/**
 * This is the "server" entry point for the /terms-and-conditions route.
 * - We fetch shop + branding data (similar to your LandingPage).
 * - We pass it as props to the "client" component (TermsAndConditionsPage).
 */
export default async function TermsServerPage() {
    // 1) Grab request headers to get the "host"
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Build your getBranding URL
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;

    // 3) Fetch branding data
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

    // 4) Parse JSON => { shop: {...}, branding: {...} }
    const brandingData = await brandingRes.json();
    const shopData = brandingData.shop || null;
    const brandDoc = brandingData.branding || null;

    // 5) Transform brandDoc images (same approach as your landing page)
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

    // 6) Return the client component, passing the data as props
    return (
        <TermsAndConditionsPage
            shopData={shopData}
            brandingData={brandDoc}
        />
    );
}
