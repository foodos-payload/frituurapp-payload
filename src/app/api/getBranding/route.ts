// Example route: /app/api/getBranding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * @openapi
 * /api/getBranding:
 *   get:
 *     summary: Get shop branding
 *     operationId: getBranding
 *     parameters:
 *       - name: host
 *         in: query
 *         required: true
 *         description: The shop's slug
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Returns shop & branding
 *       '400':
 *         description: Missing host param
 *       '404':
 *         description: No shop found for host
 *       '500':
 *         description: Server error
 */

// /app/api/getBranding/route.ts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const host = searchParams.get('host')
        if (!host) {
            return NextResponse.json({ error: 'No host param' }, { status: 400 })
        }

        const payload = await getPayload({ config })
        const splittedHost = host.split('.')

        let shop

        if (splittedHost.length === 2) {
            // No subdomain, e.g. "frituurmenu.be"
            // We use splittedHost[0] as the 'customdomain'
            const customDomain = splittedHost[0]
            const shopResult = await payload.find({
                collection: 'shops',
                where: {
                    customdomain: {
                        equals: customDomain,
                    },
                },
                limit: 1,
            })
            shop = shopResult.docs[0]
        } else {
            // There is a subdomain, e.g. "frituur-den-overkant.frituurwebshop.be"
            // We use only splittedHost[0] for the 'slug'
            const subdomainSlug = splittedHost[0]
            const shopResult = await payload.find({
                collection: 'shops',
                where: {
                    slug: {
                        equals: subdomainSlug,
                    },
                },
                limit: 1,
            })
            shop = shopResult.docs[0]
        }

        if (!shop) {
            return NextResponse.json({ error: `Shop not found for host: ${host}` }, { status: 404 })
        }

        // Find branding data that references this shop
        const brandingRes = await payload.find({
            collection: 'shop-branding',
            where: { shops: { in: [shop.id] } },
            depth: 2,
            limit: 1,
        })
        const branding = brandingRes.docs[0] || null

        return NextResponse.json(
            {
                shop,
                branding,
            },
            {
                status: 200,
            }
        )
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
