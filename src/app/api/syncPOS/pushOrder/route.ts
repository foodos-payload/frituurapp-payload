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
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        const orderIdParam = searchParams.get('orderId')

        if (!host) {
            return NextResponse.json({ error: 'Missing ?host=' }, { status: 400 })
        }
        if (!orderIdParam) {
            return NextResponse.json({ error: 'Missing ?orderId=' }, { status: 400 })
        }

        // 1) Payload
        const payload = await getPayload({ config })

        // 2) Find shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for slug="${host}"` }, { status: 404 })
        }

        // 3) Find active POS config
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
                error: `No active POS config for shop slug="${host}"`,
            }, { status: 404 })
        }

        // 4) Verify order ID is real
        const localOrderId = parseOrderId(orderIdParam)
        if (isNaN(localOrderId)) {
            return NextResponse.json(
                { error: `Invalid ?orderId=${orderIdParam}` },
                { status: 400 },
            )
        }

        // 5) Confirm that the local order exists (not strictly required if pushLocalOrderToCloudPOS can handle not found)
        const orderCheck = await payload.find({
            collection: 'orders',
            where: { id: { equals: localOrderId } },
            limit: 1,
        })
        const localOrder = orderCheck.docs?.[0]
        if (!localOrder) {
            return NextResponse.json(
                { error: `No local order found with ID=${orderIdParam}` },
                { status: 404 },
            )
        }

        // 6) For each POS doc, if provider='cloudpos' AND syncOrders==='to-cloudpos', push
        for (const posDoc of posResult.docs) {
            const { provider, apiKey, apiSecret, licenseName, token, syncOrders } = posDoc

            console.log(`[pushOrder] Found POS doc ${posDoc.id} for shop="${host}". syncOrders=${syncOrders}`)

            // If syncOrders is 'off', skip
            if (syncOrders === 'off') {
                console.log(`syncOrders is OFF => skipping push...`)
                continue
            }

            // Otherwise, it must be 'to-cloudpos'. We only push if provider === 'cloudpos'.
            if (provider === 'cloudpos' && syncOrders === 'to-cloudpos') {
                const instance = createPOSInstance(
                    'cloudpos',
                    apiKey ?? '',
                    apiSecret ?? '',
                    {
                        licenseName: licenseName ?? '',
                        token: token ?? '',
                        shopId: shop.id,
                        tenantId: typeof shop.tenant === 'string' ? shop.tenant : undefined,
                    },
                ) as CloudPOS

                const newId = await instance.pushLocalOrderToCloudPOS(localOrderId)
                console.log(`Pushed local order=${localOrderId} => CloudPOS ID=${newId}`)
            } else {
                console.log(`Provider="${provider}" or syncOrders="${syncOrders}" => no push.`)
            }
        }

        return NextResponse.json({
            status: 'ok',
            msg: `Order ${orderIdParam} push attempt done for shop="${host}".`,
        })
    } catch (err: any) {
        console.error('pushOrder error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}