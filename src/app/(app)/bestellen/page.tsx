// File: /app/(app)/bestellen/page.tsx
import React from 'react'
import { headers } from 'next/headers'
import BestellenLayout from './components/BestellenLayout'

export const dynamic = 'force-dynamic'

// We won’t define a strict type for the route’s context, to avoid Next 15.1 conflicts.
export default async function BestellenPage(context: any) {
    // If context.searchParams exists, store it. Otherwise, empty object.
    const searchParams = context?.searchParams || {}

    // 1) Because `headers()` returns a Promise in Next 15.1, we must await it:
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get('host') || ''
    const hostSlug = fullHost.split('.')[0] || 'defaultShop'

    // 2) If we want language from the query string: ?lang=en
    const userLangQuery = searchParams.lang ?? 'nl'

    // 3) Build the API URL for your route
    const apiUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${hostSlug}&lang=${userLangQuery}`
    console.log('Fetching from:', apiUrl)

    // 4) Fetch from your route
    const res = await fetch(apiUrl, { cache: 'no-store' })
    if (!res.ok) {
        return (
            <div style={{ padding: '1rem' }}>
                <h2>Could not load products for host: {hostSlug}</h2>
            </div>
        )
    }

    // 5) Parse JSON
    const data = await res.json()
    const categorizedProducts = data?.categorizedProducts || []
    const userLang = data?.userLang || 'nl'

    // 6) Render your layout
    return (
        <BestellenLayout
            shopSlug={hostSlug}
            categorizedProducts={categorizedProducts}
            userLang={userLang}
        />
    )
}
