import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const payload = await getPayload({ config })

    try {
        // Get host from URL search params
        const searchParams = request.nextUrl.searchParams
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json(
                { error: 'Host parameter is required' },
                { status: 400 }
            )
        }

        const shop = await payload.find({
            collection: 'shops',
            where: {
                slug: {
                    equals: host
                }
            }
        })

        const productsResult = await payload.find({
            collection: 'products',
            where: {
                shops: {
                    equals: shop.docs[0].id
                }
            },
            depth: 1
        })

        return NextResponse.json({
            products: productsResult.docs
        })

    } catch (err: any) {
        console.error('Error in /api/getProducts route:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 },
        )
    }
}
