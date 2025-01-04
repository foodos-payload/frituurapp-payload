import React from 'react'
import { headers } from 'next/headers'
import { OrderSummaryPage } from './OrderSummaryPage.client'

export const dynamic = 'force-dynamic'

export default async function OrderSummaryPageRoute({
    searchParams: promiseSearchParams,
}: {
    searchParams: Promise<{
        orderId?: string
        kiosk?: string
    }>
}) {
    const requestHeaders = headers()
    const fullHost = requestHeaders.get('host') || ''
    const hostSlug = fullHost.split('.')[0] || 'defaultShop'

    const { orderId = '999', kiosk = '' } = await promiseSearchParams
    const kioskMode = kiosk === 'true'

    return (
        <main className="min-h-screen bg-white text-gray-800">
            <OrderSummaryPage
                orderId={orderId}
                kioskMode={kioskMode}
                hostSlug={hostSlug}
            />
        </main>
    )
}
