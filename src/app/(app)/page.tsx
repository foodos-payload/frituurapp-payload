// File: /app/page.tsx
import React from "react";
import { headers } from "next/headers";
import LandingLayout from "./components/LandingLayout";

/** 1) A helper to fetch branding for both the page + generateMetadata. */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const brandingRes = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!brandingRes.ok) {
        console.error(
            `[LandingPage] Could not load branding for host: ${hostSlug} – status ${brandingRes.status}`
        );
        return null;
    }
    return brandingRes.json();
}

/** 
 * 2) Next.js 13 "generateMetadata()" for the Home page.
 *    We produce e.g. "ShopName - Bestel online via onze webshop".
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
            title: "MyShop - Bestel online via onze webshop",
        };
    }

    // c) Use siteTitle, fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";
    return {
        title: `${siteTitle} - Bestel online via onze webshop`,
    };
}

/** 
 * 3) Main page component that fetches brandDoc, categories, etc.
 *    and renders <LandingLayout />.
 */
export default async function LandingPage() {
    // 1) Determine hostSlug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Build your API URLs
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;
    const apiPaymentMethodsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getPaymentMethods?host=${hostSlug}`;
    const apiCategoriesUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getCategories?host=${hostSlug}`;

    // 3) Fetch in parallel
    const [brandingRes, pmRes, catRes] = await Promise.all([
        fetch(apiBrandingUrl, { cache: "no-store" }),
        fetch(apiPaymentMethodsUrl, { cache: "no-store" }),
        fetch(apiCategoriesUrl, { cache: "no-store" }),
    ]);

    // 4) Handle errors for Branding
    if (!brandingRes.ok) {
        console.error(
            `[LandingPage] Could not load branding for host: ${hostSlug} – status ${brandingRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load branding for host: {hostSlug}</h2>
            </div>
        );
    }

    // 5) Handle errors for Payment Methods
    if (!pmRes.ok) {
        console.error(
            `[LandingPage] Could not load payment methods for host: ${hostSlug} – status ${pmRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load payment methods for host: {hostSlug}</h2>
            </div>
        );
    }

    // 6) Handle errors for Categories
    if (!catRes.ok) {
        console.error(
            `[LandingPage] Could not load categories for host: ${hostSlug} – status ${catRes.status}`
        );
        return (
            <div style={{ padding: "1rem" }}>
                <h2>Could not load categories for host: {hostSlug}</h2>
            </div>
        );
    }

    // 7) Parse JSON
    const brandingData = await brandingRes.json(); // => { shop: {...}, branding: {...} }
    const pmData = await pmRes.json();            // => { methods: [ ... ] }
    const catData = await catRes.json();          // => { shop: {...}, categories: [ ... ] }

    // 8) Extract relevant pieces
    const shopData = brandingData.shop || null;
    const brandDoc = brandingData.branding || null;
    const paymentMethods = pmData?.methods || [];
    const categories = catData?.categories || [];

    // 9) Transform brandDoc images
    //    (Same logic as before)
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

    console.log(`[LandingPage] brandDoc AFTER transform =>`, brandDoc);
    console.log(`[LandingPage] paymentMethods =>`, paymentMethods);
    console.log(`[LandingPage] categories =>`, categories);

    // 10) Render the main layout
    return (
        <LandingLayout
            shopSlug={hostSlug}
            shopData={shopData}
            brandingData={brandDoc}
            paymentMethodsData={paymentMethods}
            categoriesData={categories}
        />
    );
}
