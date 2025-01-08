// /src/app/api/syncPOS/pushOrder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createPOSInstance } from '@/lib/pos'
import { CloudPOS } from '@/lib/pos/CloudPOS'

function parseOrderId(raw: string): number {
    return Number(raw)
}

/**
 * @openapi
 * /api/syncPOS/pushOrder:
 *   get:
 *     summary: Push local order to the active CloudPOS (if provider is "cloudpos")
 *     description: >
 *       Given a shop slug (`?host=`) and a local order ID (`?orderId=`),
 *       finds the active POS config(s) for that shop, and for each config 
 *       with `provider === "cloudpos"`, calls `pushLocalOrderToCloudPOS`.
 *     tags:
 *       - POS
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: The slug of the shop (e.g., "frituur-den-overkant").
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The local order ID to push.
 *     responses:
 *       '200':
 *         description: Successfully attempted pushing the order for the given shop and order ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 msg:
 *                   type: string
 *       '400':
 *         description: Missing query parameter (host or orderId).
 *       '404':
 *         description: Shop or order not found, or no active POS config found.
 *       '500':
 *         description: Internal server error when pushing the order.
 */

export async function GET(req: NextRequest) {
    try {
        // 1) Parse query params
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        const orderIdParam = searchParams.get('orderId')

        if (!host) {
            return NextResponse.json({ error: 'Missing ?host= param' }, { status: 400 })
        }
        if (!orderIdParam) {
            return NextResponse.json({ error: 'Missing ?orderId= param' }, { status: 400 })
        }

        // 2) Initialize Payload
        const payload = await getPayload({ config })

        // 3) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for slug="${host}"` }, { status: 404 })
        }

        // 4) Find the POS doc(s) for this shop
        const posResult = await payload.find({
            collection: 'pos',
            where: {
                and: [
                    { active: { equals: true } },
                    { shop: { equals: shop.id } },
                ],
            },
            limit: 10,
        })
        if (posResult.totalDocs === 0) {
            return NextResponse.json({
                error: `No active POS config found for shop slug="${host}"`,
            }, { status: 404 })
        }

        // 5) Fetch the local order from Payload
        const localOrderId = parseOrderId(orderIdParam)
        const findResult = await payload.find({
            collection: 'orders',
            where: { id: { equals: localOrderId } },
            limit: 1,
        })
        const localOrder = findResult.docs?.[0]
        if (!localOrder) {
            return NextResponse.json(
                { error: `No local order found with ID=${orderIdParam}` },
                { status: 404 },
            )
        }

        // 6) For each POS doc => only push if provider == 'cloudpos'
        for (const posDoc of posResult.docs) {
            console.log(`[pushOrder] Found POS doc ${posDoc.id} for shop "${host}".`)

            const { provider, apiKey, apiSecret, licenseName, token } = posDoc

            // Create an instance of your POS
            const instance = createPOSInstance(provider, apiKey, apiSecret, {
                licenseName,
                token,
                shopId: shop.id,
                tenantId: shop.tenant,
            })

            if (provider === 'cloudpos') {
                const cloudPOSInstance = instance as CloudPOS
                const newId = await cloudPOSInstance.pushLocalOrderToCloudPOS(localOrderId)
                console.log(`Pushed order => CloudPOS ID=${newId}`)
            }
            else {
                console.log(`Provider "${provider}" has no pushLocalOrderToCloudPOS method => skipping.`)
            }
        }

        // 7) Return success
        return NextResponse.json({
            status: 'ok',
            msg: `Order ${orderIdParam} attempted push to provider(s) for shop slug="${host}".`,
        })

    } catch (err: any) {
        console.error('pushOrder error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
