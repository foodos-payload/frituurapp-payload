import React from 'react'
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
    const { orderId = '999', kiosk = '' } = await promiseSearchParams

    const kioskMode = kiosk === 'true'

    return (
        <main className="min-h-screen bg-white text-gray-800">
            <OrderSummaryPage orderId={orderId} kioskMode={kioskMode} />
        </main>
    )
}
