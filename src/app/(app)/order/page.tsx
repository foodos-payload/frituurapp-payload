// File: /app/(app)/order/page.tsx
import React from 'react';
import { headers } from 'next/headers';
import OrderLayout from './components/OrderLayout';

export const dynamic = 'force-dynamic';

export default async function OrderPage(context: any) {
    // 1) Get querystring data (e.g. ?lang=en or ?kiosk=true)
    const searchParams = context?.searchParams || {};
    const kioskParam = searchParams.kiosk; // e.g. "true" or undefined
    // Next 15.1 => must await headers():
    const requestHeaders = await headers();
    const fullHost = requestHeaders.get('host') || '';
    const hostSlug = fullHost.split('.')[0] || 'defaultShop';

    // 2) Build API endpoints
    const apiProductsUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}`;

    // 3) Fetch both in parallel
    const [productsRes] = await Promise.all([
        fetch(apiProductsUrl, { cache: 'no-store' }),

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

    // 5) Extract what we need
    const categorizedProducts = productsData?.categorizedProducts || [];
    const userLocale = productsData?.userLocale || 'nl';

    // 5a) Sort by menuOrder ascending, then by name_nl alphabetically if same order
    categorizedProducts.sort((a: any, b: any) => {
        // Compare menuOrder first
        if (a.menuOrder !== b.menuOrder) {
            return a.menuOrder - b.menuOrder;
        }
        // If same menuOrder => compare by name_nl
        return a.name_nl.localeCompare(b.name_nl);
    });

    // 7) Detect kiosk mode: if `?kiosk=true` => isKiosk = true
    const isKiosk = kioskParam === 'true';

    // 8) Render the layout
    return (
        <OrderLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
            isKiosk={isKiosk}
        />
    );
}
