// File: /src/app/api/orderData/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Retrieve orders or one specific order
 *     operationId: getOrders
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *       - name: orderId
 *         in: query
 *         required: false
 *         description: If present, returns one specific order
 *         schema:
 *           type: integer
 *       - name: view
 *         in: query
 *         required: false
 *         description: "active => in_preparation, archived => complete"
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns either one order or an array of orders
 *       '400':
 *         description: Missing host param
 *       '403':
 *         description: Order doesn't belong to this shop
 *       '404':
 *         description: Shop or order not found
 *       '500':
 *         description: Server error
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        const orderId = searchParams.get('orderId')

        const viewParam = searchParams.get('view')

        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        // 1) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for host: ${host}` }, { status: 404 })
        }

        // 2) If ?orderId => return that single order
        if (orderId) {
            const singleOrder = await payload.findByID({
                collection: 'orders',
                id: orderId,
            })

            if (!singleOrder) {
                return NextResponse.json({ error: `No order found with ID: ${orderId}` }, { status: 404 })
            }

            const shopIDs = Array.isArray(singleOrder.shops)
                ? singleOrder.shops.map((s: any) => (typeof s === 'object' ? s.id : s))
                : []

            if (!shopIDs.includes(shop.id)) {
                return NextResponse.json({ error: 'Order does not belong to this shop' }, { status: 403 })
            }

            return NextResponse.json(singleOrder)
        }

        let statuses: string[] = ['awaiting_preparation', 'ready_for_pickup', 'in_delivery', 'in_preparation', 'complete']
        if (viewParam === 'active') {
            statuses = [
                'awaiting_preparation',
                'in_preparation',
                'ready_for_pickup',
                'in_delivery',
            ]
        } else if (viewParam === 'archived') {
            statuses = ['complete']
        }


        const inPrepAndCompleteOrders = await payload.find({
            collection: 'orders',
            where: {
                shops: { in: [shop.id] },
                status: { in: statuses },
            },
            sort: '-tempOrdNr',
        })

        return NextResponse.json({
            orders: inPrepAndCompleteOrders.docs,
        })
    } catch (err: any) {
        console.error('Error fetching orders:', err)
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
    }
}
