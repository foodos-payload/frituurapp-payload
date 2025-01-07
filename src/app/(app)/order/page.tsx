// File: /app/(app)/order/page.tsx
import React from 'react';
import { headers } from 'next/headers';
import OrderLayout from './components/OrderLayout';

export const dynamic = 'force-dynamic';

export default async function OrderPage(context: any) {
    // 1) Read querystring data from `context.searchParams`
    const searchParams = context?.searchParams || {};

    // For kiosk
    const kioskParam = searchParams.kiosk; // e.g. "true" or undefined
    // For allergens
    const allergensParam = searchParams.allergens || ""; // e.g. "milk,nuts" or ""

    // Next 15.1 => must await headers():
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get('host') || '';
    const hostSlug = fullHost.split('.')[0] || 'defaultShop';

    // 2) Build the base URL for getProducts
    //    Always pass `host=...`
    let apiProductsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}`;

    // If the user has selected allergens => add them
    if (allergensParam) {
        apiProductsUrl += `&allergens=${encodeURIComponent(allergensParam)}`;
    }

    // 3) Build branding endpoint
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getBranding?host=${hostSlug}`;

    // 4) Fetch both in parallel
    const [productsRes, brandingRes] = await Promise.all([
        fetch(apiProductsUrl, { cache: 'no-store' }),
        fetch(apiBrandingUrl, { cache: 'no-store' }),
    ]);

    if (!productsRes.ok) {
        return (
            <div style={{ padding: '1rem' }}>
                <h2>Could not load products for host: {hostSlug}</h2>
            </div>
        );
    }

    // 5) Parse the JSON from each response
    const productsData = await productsRes.json();
    // If brandingRes is not ok => fallback to empty object
    const brandingData = brandingRes.ok ? await brandingRes.json() : {};

    // 6) Extract what we need
    const categorizedProducts = productsData?.categorizedProducts || [];
    const userLocale = productsData?.userLocale || 'nl';
    const rawBranding = brandingData?.branding || {};

    // Sort categories by menuOrder ascending, then name_nl
    categorizedProducts.sort((a: any, b: any) => {
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder;
        }
        return a.name_nl.localeCompare(b.name_nl);
    });

    // 7) Convert raw branding to your layout’s shape
    const branding = {
        logoUrl: rawBranding.siteLogo?.s3_url ?? '',
        adImage: rawBranding.adImage?.s3_url ?? '',
        headerBackgroundColor: rawBranding.headerBackgroundColor ?? '',
        categoryCardBgColor: rawBranding.categoryCardBgColor ?? '',
        primaryColorCTA: rawBranding.primaryColorCTA ?? '',
        siteTitle: rawBranding.siteTitle ?? '',
        siteHeaderImg: rawBranding.siteHeaderImg?.s3_url ?? '',
        // etc...
    };

    // Check kiosk
    const isKiosk = kioskParam === 'true';

    // 8) Render the layout
    return (
        <OrderLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
            branding={branding}
            isKiosk={isKiosk}
        />
    );
}
