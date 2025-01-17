// File: src/app/api/getActiveServices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/getActiveServices
 * Returns an array of "active" services (for the user's tenant) with minimal fields
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config })

        console.log('[getActiveServices] userTenantId:')

        // Build your "where" query
        const whereClause = {
            'subscriptions.active': { equals: true },
        }

        console.log('[getActiveServices] Query "where":', whereClause)

        const servicesResult = await payload.find({
            collection: 'services',
            where: whereClause,
            limit: 50, // or however many you expect
            depth: 1,  // so we can get "media" data for the thumbnail
        })

        console.log('[getActiveServices] servicesResult.totalDocs:', servicesResult.totalDocs)
        // If you want to see the doc IDs or first doc:
        // console.log('[getActiveServices] docs:', servicesResult.docs.map((d: any) => d.id));

        const services = servicesResult.docs.map((svc: any) => ({
            id: svc.id,
            title_nl: svc.title_nl,
            service_thumbnail: svc.service_thumbnail,
        }))

        console.log('[getActiveServices] services array built:', services.length)

        return NextResponse.json({ services })
    } catch (err: any) {
        console.error('Error in getActiveServices route:', err)
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
    }
}
