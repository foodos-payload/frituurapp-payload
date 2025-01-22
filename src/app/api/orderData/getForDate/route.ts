// File: /src/app/api/orderData/getForDate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * @openapi
 * /api/orderData/getForDate:
 *   get:
 *     summary: "Retrieve the list of orders for a given date + fulfillmentMethod"
 *     operationId: "getOrdersForDate"
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: "The shop slug. E.g., 'my-shop'"
 *         schema:
 *           type: string
 *       - name: fulfillmentMethod
 *         in: query
 *         required: true
 *         description: "Fulfillment method, e.g. 'delivery', 'takeaway', or 'dine_in'"
 *         schema:
 *           type: string
 *       - name: date
 *         in: query
 *         required: true
 *         description: "Date in YYYY-MM-DD format (e.g. '2025-07-04')"
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: "Returns an array of orders matching that day + method"
 *       '400':
 *         description: "Missing or invalid query parameters"
 *       '404':
 *         description: "Shop not found"
 *       '500':
 *         description: "Server error"
 */
export async function GET(request: NextRequest) {
    try {
        // 1) Parse query params
        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')                  // e.g. 'frituur-den-overkant'
        const fulfillmentParam = searchParams.get('fulfillmentMethod') // e.g. 'delivery'
        const dateParam = searchParams.get('date')             // e.g. '2025-01-07'

        if (!host || !fulfillmentParam || !dateParam) {
            return NextResponse.json(
                { error: 'Required params: host, fulfillmentMethod, date (YYYY-MM-DD)' },
                { status: 400 },
            )
        }

        // 2) Build date range
        const dayStart = new Date(`${dateParam}T00:00:00.000Z`)
        const dayEnd = new Date(`${dateParam}T23:59:59.999Z`)

        // 3) Initialize Payload
        const payload = await getPayload({ config })

        // 4) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for host=${host}` }, { status: 404 })
        }

        // 5) We must use "fulfillment_method" to match the field name in the Orders config
        const whereClause: any = {
            shops: { in: [shop.id] },
            status: { not_in: ['cancelled'] },
            fulfillment_method: { equals: fulfillmentParam }, // <-- must match "fulfillment_method"
            fulfillment_date: {
                greater_than_equal: dayStart.toISOString(),
                less_than_equal: dayEnd.toISOString(),
            },
        }

        const matchedOrders = await payload.find({
            collection: 'orders',
            where: whereClause,
            limit: 200,
            sort: '-date_created',
        })

        return NextResponse.json(matchedOrders.docs)
    } catch (err: any) {
        console.error('Error in /api/orderData/getForDate =>', err)
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
    }
}
