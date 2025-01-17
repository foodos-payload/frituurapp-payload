// File: /src/app/api/manage-subscriptions/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const { serviceId, shopId, userId } = await req.json()

        if (!serviceId || !shopId || !userId) {
            return NextResponse.json(
                { error: 'serviceId, shopId, and userId are required.' },
                { status: 400 },
            )
        }

        // 1) Fetch the shop to get its tenant
        const shopRes = await payload.find({
            collection: 'shops',
            where: {
                id: { equals: shopId },
            },
            limit: 1,
        })
        const shopDoc = shopRes?.docs?.[0]
        if (!shopDoc) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 })
        }

        const tenantId = typeof shopDoc.tenant === 'object' ? shopDoc.tenant.id : shopDoc.tenant
        if (!tenantId) {
            return NextResponse.json(
                { error: 'This shop does not have an associated tenant.' },
                { status: 400 },
            )
        }

        // 2) Fetch user => ensure user is a tenant-admin for that tenant
        const userDoc = await payload.findByID({
            collection: 'users',
            id: userId,
        })
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        // userDoc.tenants = [ { tenant: "someTenantID", roles: ["tenant-admin"] }, ... ]
        const matchingTenantIndex = userDoc.tenants?.findIndex((t: any) => {
            const tID = typeof t.tenant === 'string' ? t.tenant : t.tenant?.id
            return tID === tenantId && t.roles?.includes('tenant-admin')
        })
        if (matchingTenantIndex === -1) {
            return NextResponse.json(
                { error: 'User is not a tenant-admin for this shop’s tenant.' },
                { status: 403 },
            )
        }

        // 3) Fetch the service => read its "roles" field (relationship to 'roles')
        const serviceDoc = await payload.findByID({
            collection: 'services',
            id: serviceId,
        })
        if (!serviceDoc) {
            return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
        }

        // 4) Merge serviceDoc.roles into userDoc.roles
        //    Both are relationships to the "roles" collection, so each item can be either:
        //    - a string "roleID", or
        //    - an object { id: "roleID", ... }.
        const serviceRoleIDs = Array.isArray(serviceDoc.roles)
            ? serviceDoc.roles.map((role: any) => (typeof role === 'string' ? role : role.id))
            : []

        const userRoleIDs = Array.isArray(userDoc.roles)
            ? userDoc.roles.map((role: any) => (typeof role === 'string' ? role : role.id))
            : []

        // unify them (remove duplicates)
        const updatedRoleIDs = Array.from(new Set([...userRoleIDs, ...serviceRoleIDs]))

        // 5) Save updated user doc => only updating top-level "roles"
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                roles: updatedRoleIDs,
                // We do NOT touch tenants[].roles here
                // tenants: userDoc.tenants, // not necessary unless you changed tenants
            },
        })

        // 6) Optionally update the service doc => unify its .tenants and .shops
        //    so the service "knows" which tenants/shops are using it
        const existingTenantIDs = Array.isArray(serviceDoc.tenants)
            ? serviceDoc.tenants.map((t: any) => (typeof t === 'string' ? t : t.id))
            : []
        const existingShopIDs = Array.isArray(serviceDoc.shops)
            ? serviceDoc.shops.map((s: any) => (typeof s === 'string' ? s : s.id))
            : []

        const updatedTenantIDs = Array.from(new Set([...existingTenantIDs, tenantId]))
        const updatedShopIDs = Array.from(new Set([...existingShopIDs, shopId]))

        await payload.update({
            collection: 'services',
            id: serviceId,
            data: {
                tenants: updatedTenantIDs,
                shops: updatedShopIDs,
            },
        })

        // Return success
        return NextResponse.json({
            success: true,
            message: 'Service roles added to user’s top-level "roles" successfully.',
        })
    } catch (error: any) {
        console.error('Error managing subscription:', error)
        return NextResponse.json(
            { error: 'Subscription processing failed.' },
            { status: 500 },
        )
    }
}
