// /src/app/api/syncPOS/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createPOSInstance } from '@/lib/pos'

/**
 * @openapi
 * /api/syncPOS:
 *   get:
 *     summary: Sync categories, products, and subproducts for the active POS configs of a shop
 *     description: >
 *       Given a shop slug (`?host=`), finds all active POS configs for that shop,
 *       creates an instance for each, and calls `syncCategories`, `syncProducts`, 
 *       and `syncSubproducts`.
 *     tags:
 *       - POS
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         required: true
 *         description: The slug of the shop (e.g., "frituur-den-overkant").
 *     responses:
 *       '200':
 *         description: Successfully synced POS data for the given shop.
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
 *         description: Missing query parameter (host).
 *       '404':
 *         description: Shop not found or no active POS config found.
 *       '500':
 *         description: Internal server error occurred while syncing.
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')

        if (!host) {
            return NextResponse.json({ error: 'Missing ?host=' }, { status: 400 })
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

        // 3) Find active POS doc(s)
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
            return NextResponse.json(
                { error: `No active POS config for shop slug="${host}"` },
                { status: 404 },
            )
        }

        // 4) For each POS doc => create instance => check toggles => sync
        for (const posDoc of posResult.docs) {
            console.log(`[syncPOS] Found POS doc ${posDoc.id} for shop ${host}.`)

            const {
                provider,
                apiKey,
                apiSecret,
                licenseName,
                token,

                // Our new toggles
                syncProducts,
                syncCategories,
                syncSubproducts,
                // syncOrders // not used here, see pushOrder route
            } = posDoc

            const instance = createPOSInstance(provider ?? '', apiKey ?? '', apiSecret ?? '', {
                licenseName: licenseName ?? '',
                token: token ?? '',
                shopId: shop.id,
                tenantId: typeof shop.tenant === 'string' ? shop.tenant : undefined,
            })

            // 4a) Sync categories
            if (syncCategories && syncCategories !== 'off') {
                await instance.syncCategories(syncCategories)
            }

            // 4b) Sync products
            if (syncProducts && syncProducts !== 'off') {
                await instance.syncProducts(syncProducts)
            }

            // 4c) Sync subproducts
            if (syncSubproducts && syncSubproducts !== 'off') {
                await instance.syncSubproducts(syncSubproducts)
            }
        }

        return NextResponse.json({
            status: 'ok',
            msg: `POS sync done for shop="${host}". Found ${posResult.totalDocs} config(s).`,
        })
    } catch (err: any) {
        console.error('syncPOS error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}