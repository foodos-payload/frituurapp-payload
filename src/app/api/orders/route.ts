// Example: /api/orders route

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for host: ${host}` }, { status: 404 })
        }

        const inPrepAndCompleteOrders = await payload.find({
            collection: 'orders',
            where: {
                shops: { in: [shop.id] },

                status: { in: ['in_preparation', 'complete'] },
            },
            sort: '-tempOrdNr',
            limit: 50,
        })

        return NextResponse.json({
            orders: inPrepAndCompleteOrders.docs,
        })
    } catch (err: any) {
        console.error('Error fetching orders:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
