// File: /src/app/api/getPaymentMethods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
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

        const pmResult = await payload.find({
            collection: 'payment-methods',
            where: { shops: { equals: shop.id } },
            limit: 50,
        })

        const methods = pmResult.docs.map((pm: any) => ({
            id: pm.id,
            label: pm.provider ?? 'Unnamed Payment Method',
        }))

        return NextResponse.json({ methods })
    } catch (err: any) {
        console.error('Error fetching payment methods:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown error' },
            { status: 500 },
        )
    }
}
