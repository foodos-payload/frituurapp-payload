// File: /src/app/api/getPaymentMethods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * @openapi
 * /api/getPaymentMethods:
 *   get:
 *     summary: Retrieve payment methods for a given shop
 *     operationId: getPaymentMethods
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug (subdomain)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns an array of payment methods
 *       '400':
 *         description: Missing or invalid host
 *       '404':
 *         description: Shop not found
 *       '500':
 *         description: Server error
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'Host param required' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        // 1) Find the shop
        const shopResult = await payload.find({
            collection: 'shops',
            where: { slug: { equals: host } },
            limit: 1,
        })
        const shop = shopResult.docs?.[0]
        if (!shop) {
            return NextResponse.json({ error: `No shop found for host: ${host}` }, { status: 404 })
        }

        // 2) Fetch PaymentMethod docs for this shop
        const pmResult = await payload.find({
            collection: 'payment-methods',
            where: { shops: { equals: shop.id } },
            limit: 50,
            depth: 3, // If you need to fetch nested relationships
        })

        /**
         * For each PaymentMethod doc:
         *  - `pm.provider` might be 'multisafepay', 'cash_on_delivery', etc.
         *  - `pm.enabled` is the main checkbox
         *  - `pm.multisafepay_settings` is your group { enable_test_mode, live_api_key, test_api_key, methods }
         * 
         * We'll exclude `live_api_key`, but return the others if `pm.provider === 'multisafepay'`.
         */
        const methods = pmResult.docs.map((pm: any) => {
            // Common fields
            const base = {
                id: pm.id,
                label: pm.provider ?? 'Unnamed Payment Method',
                enabled: pm.enabled ?? true,
            }

            // If MultiSafePay, return some subset of the group fields:
            if (pm.provider === 'multisafepay' && pm.multisafepay_settings) {
                // We intentionally exclude pm.multisafepay_settings.live_api_key
                return {
                    ...base,
                    // For clarity, rename to "providerSettings" or keep separate
                    multisafepay_settings: {
                        enable_test_mode: pm.multisafepay_settings.enable_test_mode || false,
                        test_api_key: pm.multisafepay_settings.test_api_key || '',
                        methods: pm.multisafepay_settings.methods || [],
                        // DO NOT expose live_api_key
                    },
                }
            }

            // Otherwise (e.g. 'cash_on_delivery'), just return base or any relevant fields
            return base
        })

        return NextResponse.json({ methods })
    } catch (err: any) {
        console.error('Error fetching payment methods:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown error' },
            { status: 500 },
        )
    }
}
