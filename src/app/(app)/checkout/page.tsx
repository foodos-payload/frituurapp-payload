// File: /src/app/(app)/checkout/page.tsx
import React from 'react'
import { headers } from 'next/headers'
import CheckoutPage from './components/CheckoutPage'

export const dynamic = 'force-dynamic'

export default async function CheckoutRoute() {
    const headersList = headers()
    const fullHost = headersList.get('host') || ''
    const hostSlug = fullHost.split('.')[0] || 'defaultShop'

    // 1) Payment Methods
    let paymentMethods = []
    try {
        const paymentRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getPaymentMethods?host=${encodeURIComponent(
                hostSlug,
            )}`,
            { cache: 'no-store' },
        )
        if (paymentRes.ok) {
            const data = await paymentRes.json()
            paymentMethods = data?.methods || []
        }
    } catch (err) {
        console.error('Error fetching payment methods:', err)
    }

    // 2) Timeslots
    let timeslots = []
    try {
        const tsRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getTimeslots?host=${encodeURIComponent(
                hostSlug,
            )}`,
            { cache: 'no-store' },
        )
        if (tsRes.ok) {
            const data = await tsRes.json()
            timeslots = data?.timeslots || []
        }
    } catch (err) {
        console.error('Error fetching timeslots:', err)
    }

    // 3) Shop info => lat/lng
    let shopInfo = null
    try {
        const shopsRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getShop?host=${encodeURIComponent(hostSlug)}`,
            { cache: 'no-store' },
        )
        const data = await shopsRes.json()
        shopInfo = data?.shop || null
    } catch (err) {
        console.error('Error fetching shop info:', err)
    }

    // 4) Fulfillment info => e.g. /api/getFulFillment
    let fulfillmentMethods = []
    try {
        const fmRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getFulFillment?host=${encodeURIComponent(
                hostSlug,
            )}`,
            { cache: 'no-store' },
        )
        if (fmRes.ok) {
            fulfillmentMethods = await fmRes.json()
        }
    } catch (err) {
        console.error('Error fetching fulfillment methods:', err)
    }

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <CheckoutPage
                hostSlug={hostSlug}
                initialPaymentMethods={paymentMethods}
                initialTimeslots={timeslots}
                shopInfo={shopInfo}
                fulfillmentMethods={fulfillmentMethods}
            />
        </main>
    )
}
