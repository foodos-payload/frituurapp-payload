// Example route: /app/api/branding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'No host param' }, { status: 400 })
        }

        // Load the shop from your Shops collection
        const payload = await getPayload({ config })
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs[0]
        if (!shop) {
            return NextResponse.json({ error: `Shop not found for host: ${host}` }, { status: 404 })
        }

        const brandingRes = await payload.find({
            collection: 'shop-branding',
            where: { shops: { in: [shop.id] } },
            depth: 2,
            limit: 1,
        })
        const branding = brandingRes.docs[0] || null

        return NextResponse.json({
            shop,
            branding,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
