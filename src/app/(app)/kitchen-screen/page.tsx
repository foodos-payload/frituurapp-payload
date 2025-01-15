// File: src/app/(app)/kitchen-screen/page.tsx

import React from "react";
import { headers } from "next/headers";
import KitchenScreen from "./components/KitchenScreen";

export const dynamic = "force-dynamic";

/**
 * A minimal helper to fetch branding so we can get the shop's siteTitle.
 */
async function fetchBranding(hostSlug: string) {
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${encodeURIComponent(
        hostSlug
    )}`;
    const res = await fetch(apiBrandingUrl, { cache: "no-store" });
    if (!res.ok) {
        console.error(
            `[KitchenScreenPage] Branding fetch error for host ${hostSlug} - status ${res.status}`
        );
        return null;
    }
    return res.json(); // => { shop: {...}, branding: {...} }
}

/**
 * Next.js 13 "generateMetadata()" to build <title>, <meta> tags, etc.
 */
export async function generateMetadata() {
    // 1) Determine host slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) Fetch minimal branding
    const brandingData = await fetchBranding(hostSlug);
    if (!brandingData?.branding) {
        // fallback
        return { title: "MyShop - Kitchen" };
    }

    // 3) Use siteTitle, fallback "MyShop"
    const siteTitle = brandingData.branding.siteTitle || "MyShop";

    return {
        title: `${siteTitle} - Kitchen`,
    };
}

/**
 * The main server component:
 *  - Finds host slug
 *  - Renders the KitchenScreen client component
 */
export default async function KitchenScreenPage() {
    // 1) figure out the host slug
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get("host") || "";
    const hostSlug = fullHost.split(".")[0] || "defaultShop";

    // 2) (Optionally read searchParams if needed)
    //    e.g. const { searchParams } = new URL(request.url)

    return (
        <main className="min-h-screen bg-white text-gray-800 p-4">
            <KitchenScreen hostSlug={hostSlug} />
        </main>
    );
}
