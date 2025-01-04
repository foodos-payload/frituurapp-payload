import React from 'react'
import { headers } from 'next/headers'
import { OrderStatusPage } from './OrderStatusPage.client'

export const dynamic = 'force-dynamic'

export default async function OrderStatusPageRoute() {
    const requestHeaders = await headers()
    const fullHost = requestHeaders.get('host') || ''
    const hostSlug = fullHost.split('.')[0] || 'defaultShop'

    return <OrderStatusPage hostSlug={hostSlug} />
}
