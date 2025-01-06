// File: /src/app/api/getFulFillment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * @openapi
 * /api/getFulFillment:
 *   get:
 *     summary: Retrieve fulfillment methods for a shop
 *     operationId: getFulfillmentMethods
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Array of fulfillment methods
 *       '400':
 *         description: Missing host param
 *       '404':
 *         description: No shop found
 *       '500':
 *         description: Failed to retrieve fulfillment methods
 */


export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        const { searchParams } = request.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'Host parameter is required' }, { status: 400 })
        }

        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for host: ${host}` }, { status: 404 })
        }

        const fulfillments = await payload.find({
            collection: 'fulfillment-methods',
            where: {
                shops: {
                    equals: shop.id,
                },
            },
            limit: 50,
        })

        return NextResponse.json(fulfillments.docs)
    } catch (error: any) {
        console.error('Error fetching fulfillment methods:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve fulfillment methods' },
            { status: 500 },
        )
    }
}
