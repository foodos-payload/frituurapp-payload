// /src/app/api/syncPOS/pushOrder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createPOSInstance } from '@/lib/pos'


function parseOrderId(raw: string): number {
    return Number(raw)
}

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
            return NextResponse.json({ error: `No shop found for slug: "${host}"` }, { status: 404 })
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
                error: `No active POS config found for shop slug "${host}"`,
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

        // 6) For each POS doc => call pushLocalOrderToCloudPOS
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

            // 6a) If your pushLocalOrderToCloudPOS expects just an ID:
            const newCloudPOSOrderId = await instance.pushLocalOrderToCloudPOS(localOrderId)

            if (newCloudPOSOrderId) {
                await payload.update({
                    collection: 'orders',
                    id: localOrder.id,
                    data: { cloudPOSId: newCloudPOSOrderId },
                })
            }
            console.log(`[pushOrder] Order ID=${localOrder.id} pushed => CloudPOS weborderId=${newCloudPOSOrderId}`)
        }

        // 7) Return success
        return NextResponse.json({
            status: 'ok',
            msg: `Order ${orderIdParam} pushed to CloudPOS for shop slug="${host}".`,
        })

    } catch (err: any) {
        console.error('pushOrder error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
