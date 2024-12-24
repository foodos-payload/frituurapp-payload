import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTenantAdminTenantAccessIDs } from '@/utilities/getTenantAccessIDs'

export const dynamic = 'force-dynamic'
// so we can read request headers, etc. without Next complaining

export async function GET(request: NextRequest) {
    try {
        // 1. Initialize your local Payload instance
        const payload = await getPayload({ config })

        // 2. Attempt to authenticate this request
        //    This uses the same approach as "payload.auth({ headers })".
        const { user } = await payload.auth({
            headers: request.headers, // pass the fetch-style Headers
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized, please log in.' }, { status: 401 })
        }

        // 3. Parse the domain from request headers
        const host = request.headers.get('host') // e.g. tenant-1.localhost:3000
        if (!host) {
            return NextResponse.json({ error: 'No host header found' }, { status: 400 })
        }

        // 4. Look up the tenant by domain
        const tenantResult = await payload.find({
            collection: 'tenants',
            where: {
                'domains.domain': { equals: host },
            },
            limit: 1,
        })

        const tenant = tenantResult.docs?.[0]
        if (!tenant) {
            return NextResponse.json({ error: `No tenant found for host "${host}"` }, { status: 404 })
        }

        // 5. Check if user is super-admin or is a tenant-admin for this tenant
        const isSuperAdmin = user.roles?.includes('super-admin')
        if (!isSuperAdmin) {
            // If not super-admin, see if user is a tenant-admin for this domain's tenant
            const userAdminTenants = getTenantAdminTenantAccessIDs(user)
            if (!userAdminTenants.includes(tenant.id)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // 6. Authorized—fetch the shops for that tenant
        const shopsResult = await payload.find({
            collection: 'shops',
            where: {
                tenant: {
                    equals: tenant.id,
                },
            },
        })

        // 7. Return the shops
        return NextResponse.json({
            tenant: tenant.name,
            domain: host,
            shops: shopsResult.docs,
        })

    } catch (err: any) {
        console.error('Error in /api/getShops route:', err)
        return NextResponse.json(
            { error: err?.message || 'Unknown server error' },
            { status: 500 },
        )
    }
}
