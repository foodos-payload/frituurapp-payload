// File: src/app/api/getNonActiveServices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/getNonActiveServices
 * Returns services that do NOT have `subscriptions.active = true`
 * for any array entry. 
 * 
 * This route does NOT do tenant logic; it simply excludes 
 * services that have an array item with active=true.
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        // For example, "active != true" can be done with "not_equals: true"
        // on the `subscriptions.active` field
        const whereClause = {
            'subscriptions.active': { not_equals: true },
        }

        console.log('[getNonActiveServices] Query "where":', whereClause)

        const servicesResult = await payload.find({
            collection: 'services',
            where: whereClause,
            limit: 50,
            depth: 1, // to get thumbnail data
        })

        console.log('[getNonActiveServices] totalDocs:', servicesResult.totalDocs)

        const services = servicesResult.docs.map((svc: any) => ({
            id: svc.id,
            title_nl: svc.title_nl,
            service_thumbnail: svc.service_thumbnail,
        }))

        console.log('[getNonActiveServices] services array:', services.length)

        return NextResponse.json({ services })
    } catch (err: any) {
        console.error('[getNonActiveServices] error:', err)
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
    }
}
