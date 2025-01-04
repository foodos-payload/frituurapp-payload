// File: src/app/(app)/checkout/page.tsx
import React from 'react'
import { headers } from 'next/headers'
import CheckoutPage from './components/CheckoutPage'

export const dynamic = 'force-dynamic'

type Timeslot = {
    id: string
    day: string
    time: string
    fulfillmentMethod: string
    isFullyBooked?: boolean
}
type PaymentMethod = {
    id: string
    label: string
}

export default async function CheckoutRoute() {
    // 1) Wait for the headers
    const headersList = await headers()
    const fullHost = headersList.get('host') || ''
    const hostSlug = fullHost.split('.')[0] || 'defaultShop'

    // 2) Fetch Payment Methods
    let paymentMethods: PaymentMethod[] = []
    try {
        const paymentRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getPaymentMethods?host=${encodeURIComponent(hostSlug)}`,
            { cache: 'no-store' }
        )
        if (paymentRes.ok) {
            const data = await paymentRes.json()
            paymentMethods = data?.methods || []
        }
    } catch (err) {
        console.error('Error fetching payment methods:', err)
    }

    // 3) Fetch Timeslots
    let timeslots: Timeslot[] = []
    try {
        const tsRes = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getTimeslots?host=${encodeURIComponent(hostSlug)}`,
            { cache: 'no-store' }
        )
        if (tsRes.ok) {
            const data = await tsRes.json()
            timeslots = data?.timeslots || []
        }
    } catch (err) {
        console.error('Error fetching timeslots:', err)
    }

    // 4) Render the CheckoutPage—no kiosk mode at all
    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <CheckoutPage
                hostSlug={hostSlug}
                // kioskMode completely removed
                initialPaymentMethods={paymentMethods}
                initialTimeslots={timeslots}
            />
        </main>
    )
}
