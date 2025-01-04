import React from 'react'
import { OrderSummaryPage } from './OrderSummaryPage.client'

// (Optional) Let Next know we want to force dynamic rendering if needed:
export const dynamic = 'force-dynamic'

/**
 * page.tsx is a Server Component by default.
 * We parse searchParams, then pass them to our client component.
 */
export default function OrderSummaryPageRoute({
    searchParams,
}: {
    searchParams?: {
        orderId?: string
        kiosk?: string
    }
}) {
    // 1) Read any params from the URL, e.g. ?orderId=123&kiosk=true
    const orderId = searchParams?.orderId ?? '999' // fallback
    const kioskMode = searchParams?.kiosk === 'true'

    // 2) Return minimal server-side wrapper, embedding your client component.
    //    Use tailwind for any container-level styling you want.
    return (
        <main className="min-h-screen bg-white text-gray-800">
            <OrderSummaryPage orderId={orderId} kioskMode={kioskMode} />
        </main>
    )
}
