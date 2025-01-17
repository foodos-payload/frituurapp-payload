// File: /src/app/api/manage-subscriptions/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const {
            serviceId,
            shopId,
            userId,
            stripeSubscriptionId, // <-- subscription ID from Stripe Checkout
        } = await req.json()

        if (!serviceId || !shopId || !userId) {
            return NextResponse.json(
                { error: 'serviceId, shopId, and userId are required.' },
                { status: 400 },
            )
        }

        // 1) Fetch the shop to get its tenant
        const shopRes = await payload.find({
            collection: 'shops',
            where: { id: { equals: shopId } },
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

        // 3) Fetch the service => read its "roles" field
        const serviceDoc = await payload.findByID({
            collection: 'services',
            id: serviceId,
        })
        if (!serviceDoc) {
            return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
        }

        // 4) Merge serviceDoc.roles into userDoc.roles
        const serviceRoleIDs = Array.isArray(serviceDoc.roles)
            ? serviceDoc.roles.map((role: any) => (typeof role === 'string' ? role : role.id))
            : []
        const userRoleIDs = Array.isArray(userDoc.roles)
            ? userDoc.roles.map((role: any) => (typeof role === 'string' ? role : role.id))
            : []

        const updatedRoleIDs = Array.from(new Set([...userRoleIDs, ...serviceRoleIDs]))

        // 5) Save updated user doc => only updating top-level "roles"
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                roles: updatedRoleIDs,
                // We do NOT modify tenants[].roles here unless needed
            },
        })

        // 6) Update the service doc => push/update the subscription object
        const existingSubscriptions = serviceDoc.subscriptions || []

        const existingIndex = existingSubscriptions.findIndex((sub: any) => {
            // If sub.shopId is an object, compare sub.shopId.id; else compare sub.shopId directly
            return sub.shopId?.id === shopId || sub.shopId === shopId
        })

        if (existingIndex === -1) {
            // If no sub for this shop, push a new subscription record
            existingSubscriptions.push({
                shopId,                     // relationship to 'shops'
                stripeSubscriptionId: stripeSubscriptionId || '',
                status: 'active',
                cancel_at_period_end: false,
                current_period_end: null,
                userId,                     // optionally store userId for later reference
            })
        } else {
            // If we do have one, update it to active
            existingSubscriptions[existingIndex].status = 'active'
            existingSubscriptions[existingIndex].cancel_at_period_end = false

            // If Stripe gave us a subscriptionId from Checkout, set/overwrite it
            if (stripeSubscriptionId) {
                existingSubscriptions[existingIndex].stripeSubscriptionId = stripeSubscriptionId
            }
            // Optionally store or overwrite userId
            existingSubscriptions[existingIndex].userId = userId
        }

        await payload.update({
            collection: 'services',
            id: serviceId,
            data: {
                subscriptions: existingSubscriptions,
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
