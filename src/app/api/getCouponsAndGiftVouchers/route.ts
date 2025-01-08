import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * @openapi
 * /api/getCouponsAndGiftVouchers:
 *   get:
 *     summary: Retrieve all active coupons and gift vouchers for a given shop
 *     description: Fetches available (not fully used, not expired) coupons and gift vouchers for the specified shop slug.
 *     parameters:
 *       - in: query
 *         name: shop
 *         required: true
 *         description: The slug of the shop
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns an object containing arrays of coupons and gift vouchers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupons:
 *                   type: array
 *                   items:
 *                     type: object
 *                 giftVouchers:
 *                   type: array
 *                   items:
 *                     type: object
 *       '400':
 *         description: Missing shop parameter
 *       '404':
 *         description: Shop not found
 *       '500':
 *         description: Error retrieving coupons or gift vouchers
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })
        const { searchParams } = request.nextUrl

        // 1) Extract the 'shop' query param
        const shopSlug = searchParams.get('shop')
        if (!shopSlug) {
            return NextResponse.json(
                { error: 'Missing shop parameter' },
                { status: 400 }
            )
        }

        // 2) Find the shop by slug
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: shopSlug } },
            limit: 1,
        })

        if (!shopResult.docs.length) {
            return NextResponse.json(
                { error: `No shop found for slug: ${shopSlug}` },
                { status: 404 }
            )
        }

        const shopDoc = shopResult.docs[0]

        // 3) Query Coupons for this shop
        // Adjust filters if you want to include expired or used coupons
        const couponsResult = await payload.find({
            collection: 'coupons',
            where: {
                shops: { equals: shopDoc.id },
                used: { not_equals: true }, // optional: only show not fully "used" coupons
                valid_from: { less_than_equal: new Date().toISOString() },
                valid_until: { greater_than: new Date().toISOString() },
            },
            limit: 999,
        })

        // 4) Query Gift Vouchers for this shop
        const giftVouchersResult = await payload.find({
            collection: 'gift-vouchers',
            where: {
                shops: { equals: shopDoc.id },
                used: { not_equals: true }, // optional: only show not used
                valid_from: { less_than_equal: new Date().toISOString() },
                valid_until: { greater_than: new Date().toISOString() },
            },
            limit: 999,
        })

        // 5) Combine & Return
        const responseData = {
            coupons: couponsResult.docs,
            giftVouchers: giftVouchersResult.docs,
        }
        return NextResponse.json(responseData, { status: 200 })

    } catch (err: any) {
        console.error('[getCouponsAndGiftVouchers] error:', err)
        return NextResponse.json(
            { error: 'Failed to retrieve coupons or gift vouchers' },
            { status: 500 }
        )
    }
}
