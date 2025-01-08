// /src/app/api/syncPOS/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createPOSInstance } from '@/lib/pos'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')

        if (!host) {
            return NextResponse.json({ error: 'Missing ?host= (shop slug)' }, { status: 400 })
        }

        // 1) Initialize Payload
        const payload = await getPayload({ config })

        // 2) Find the Shop by its slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for slug: "${host}"` }, { status: 404 })
        }

        // 3) Find the POS doc(s) for this shop
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
                error: `No active POS config found for shop slug "${host}"`,
            }, { status: 404 })
        }

        // 4) For each POS doc => create instance => sync
        for (const posDoc of posResult.docs) {
            console.log(`[syncPOS] Found POS doc ${posDoc.id} for shop ${host}.`)

            // e.g. if you stored licenseName & token in posDoc
            const { provider, apiKey, apiSecret, licenseName, token } = posDoc

            const instance = createPOSInstance(provider, apiKey, apiSecret, {
                licenseName,
                token,
                shopId: shop.id,
                tenantId: shop.tenant,
            })
            await instance.syncCategories()
            await instance.syncProducts()
            await instance.syncSubproducts()
        }

        return NextResponse.json({
            status: 'ok',
            msg: `POS sync done for shop slug="${host}". Found ${posResult.totalDocs} POS config(s).`,
        })
    } catch (err: any) {
        console.error('syncPOS error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
