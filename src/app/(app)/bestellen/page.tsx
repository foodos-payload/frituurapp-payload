// File: /app/(app)/bestellen/page.tsx
import React from 'react';
import { headers } from 'next/headers';
import BestellenLayout from './components/BestellenLayout';

export const dynamic = 'force-dynamic';

export default async function BestellenPage(context: any) {
    // 1) Get querystring data (e.g. ?lang=en)
    const searchParams = context?.searchParams || {};
    // Next 15.1 => must await headers():
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get('host') || '';
    const hostSlug = fullHost.split('.')[0] || 'defaultShop';
    const userLangQuery = searchParams.lang ?? 'nl';

    // 2) Build API endpoints
    const apiProductsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}&lang=${userLangQuery}`;
    const apiBrandingUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/branding?host=${hostSlug}`;

    console.log('[BestellenPage] Fetching products from:', apiProductsUrl);
    console.log('[BestellenPage] Fetching branding from:', apiBrandingUrl);

    // 3) Fetch both in parallel
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

    // 4) Parse the JSON from each response
    const productsData = await productsRes.json();
    // If brandingRes is not ok => fallback to empty object
    const brandingData = brandingRes.ok ? await brandingRes.json() : {};

    // 5) Extract what we need
    const categorizedProducts = productsData?.categorizedProducts || [];
    const userLang = productsData?.userLang || 'nl';
    const rawBranding = brandingData?.branding || {};

    console.log('[BestellenPage] productsData:', productsData);
    console.log('[BestellenPage] rawBranding:', rawBranding);

    // 6) Convert payload branding to the shape your BestellenLayout wants
    // For example, if rawBranding.siteLogo?.s3_url is your main logo:
    const branding = {
        logoUrl: rawBranding.siteLogo?.s3_url ?? '',
        adImage: rawBranding.adImage?.s3_url ?? '',
        headerBackgroundColor: rawBranding.headerBackgroundColor ?? '',
        categoryCardBgColor: rawBranding.categoryCardBgColor ?? '',
        primaryColorCTA: rawBranding.primaryColorCTA ?? '',
        siteTitle: rawBranding.siteTitle ?? '',
        // Add more fields if needed
    };

    console.log('[BestellenPage] final branding passed to <BestellenLayout>:', branding);

    // 7) Render the layout
    return (
        <BestellenLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
            userLang={userLang}
            branding={branding}
        />
    );
}
