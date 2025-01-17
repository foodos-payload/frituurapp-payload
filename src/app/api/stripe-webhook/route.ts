import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@payload-config'

// export const config = {
//     api: {
//         bodyParser: false, // for raw body if needed by Stripe
//     },
// }

async function bufferReadableStream(readable: ReadableStream) {
    const reader = readable.getReader()
    const chunks = []
    let done = false
    while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) chunks.push(value)
        done = readerDone
    }
    return Buffer.concat(chunks)
}

export async function POST(req: Request) {
    let event: Stripe.Event

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    })

    const sig = req.headers.get('stripe-signature')
    if (!sig) {
        return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    try {
        const rawBody = await bufferReadableStream(req.body as any)
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        )
    } catch (err: any) {
        console.error('Webhook Error:', err)
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session

            // If the session.mode === 'subscription', we can get subscription ID here
            const stripeSubscriptionId = session.subscription
            if (!stripeSubscriptionId) {
                console.warn('No subscription ID on completed session')
                break
            }

            // Metadata from our create-checkout-session route
            const serviceId = session.metadata?.service_id || ''
            const tenantId = session.metadata?.tenant_id || ''
            const shopId = session.metadata?.shop_id || ''
            const userId = session.metadata?.user_id || ''

            await activateSubscription({
                stripe,
                serviceId,
                tenantId,
                shopId,
                userId,
                stripeSubscriptionId: String(stripeSubscriptionId),
            })

            break
        }

        // For subscription cancellations or changes:
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription
            const stripeSubscriptionId = subscription.id

            // We can read the metadata from the subscription, if you set it there;
            // but usually we stored our info in checkout.session metadata.
            // So you might need to store it again, or do a separate lookup.
            // For simplicity, let's assume you do something like:
            const serviceId = subscription.metadata?.service_id
            const tenantId = subscription.metadata?.tenant_id
            const shopId = subscription.metadata?.shop_id
            const userId = subscription.metadata?.user_id

            if (!serviceId || !shopId || !tenantId || !userId) {
                console.warn('Subscription missing metadata for service/shop/tenant/user')
                break
            }

            if (event.type === 'customer.subscription.deleted') {
                // Mark active: false
                await deactivateSubscription({
                    stripeSubscriptionId,
                    serviceId,
                    shopId,
                    tenantId,
                    userId,
                })
            } else {
                // e.g. if subscription is paused or updated price
                // or we detect if subscription.status === 'active' => ensure active: true
                // or if subscription.status === 'canceled' => call deactivateSubscription
                // etc.
            }

            break
        }

        default:
            // Unhandled event type
            console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
}

/** Activates a subscription in Payload and applies the Service's roles to the user */
async function activateSubscription({
    stripe,
    serviceId,
    tenantId,
    shopId,
    userId,
    stripeSubscriptionId,
}: {
    stripe: Stripe
    serviceId: string
    tenantId: string
    shopId: string
    userId: string
    stripeSubscriptionId: string
}) {
    const payload = await getPayload({ config })

    // 0) Fetch the subscription from Stripe to get the actual customer ID
    const subscriptionObj = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    // subscriptionObj.customer can be a string or object
    const stripeCustomerId = typeof subscriptionObj.customer === 'string'
        ? subscriptionObj.customer
        : subscriptionObj.customer.id

    // NEW: 2) Set stripeCustomerId on the tenant if not already set
    const tenantDoc = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
    })

    if (!tenantDoc) {
        console.warn('Tenant not found, cannot store stripeCustomerId.')
    } else if (!tenantDoc.stripeCustomerId) {
        // If there's no existing ID, update it now
        await payload.update({
            collection: 'tenants',
            id: tenantId,
            data: {
                stripeCustomerId,
            },
        })
    }
    // 1) Find the service doc
    const serviceDoc = await payload.findByID({
        collection: 'services',
        id: serviceId,
    })
    console.log(serviceDoc)
    if (!serviceDoc) {
        console.warn('Service not found in activateSubscription')
        return
    }

    const subs = Array.isArray(serviceDoc.subscriptions) ? serviceDoc.subscriptions : []
    // 2) Find the matching sub item
    let foundIndex = subs.findIndex((sub: any) => {
        const shopValue = typeof sub.shop === 'object' ? sub.shop?.id : sub.shop
        const tenantValue = typeof sub.tenant === 'object' ? sub.tenant?.id : sub.tenant
        return shopValue === shopId && tenantValue === tenantId
    })

    if (foundIndex === -1) {
        // Not found, let's push a new one
        foundIndex = subs.length
        subs.push({
            tenant: tenantId,
            shop: shopId,
            stripeSubscriptionId,
            active: true,
        })
    } else {
        // Mark as active, store subscription ID
        subs[foundIndex].active = true
        subs[foundIndex].stripeSubscriptionId = stripeSubscriptionId
    }

    // 3) Update the service doc
    await payload.update({
        collection: 'services',
        id: serviceId,
        data: {
            subscriptions: subs,
        },
    })

    // 4) Add roles to user
    //    => Typically we unify the user’s roles with the service’s roles
    const serviceRoleIDs = Array.isArray(serviceDoc.roles)
        ? serviceDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []

    // Fetch the user doc
    const userDoc = await payload.findByID({
        collection: 'users',
        id: userId,
    })
    if (!userDoc) {
        console.warn('User not found in activateSubscription')
        return
    }

    const userRoleIDs = Array.isArray(userDoc.roles)
        ? userDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []

    // Merge
    const newRoleIDs = Array.from(new Set([...userRoleIDs, ...serviceRoleIDs]))

    await payload.update({
        collection: 'users',
        id: userId,
        data: { roles: newRoleIDs },
    })
}

/** Deactivates a subscription in Payload and removes roles from the user if no other active sub remains. */
async function deactivateSubscription({
    stripeSubscriptionId,
    serviceId,
    shopId,
    tenantId,
    userId,
}: {
    stripeSubscriptionId: string
    serviceId: string
    shopId: string
    tenantId: string
    userId: string
}) {
    const payload = await getPayload({ config })
    // 1) Find the service doc
    const serviceDoc = await payload.findByID({
        collection: 'services',
        id: serviceId,
    })
    if (!serviceDoc) {
        console.warn('Service not found in deactivateSubscription')
        return
    }

    const subs = Array.isArray(serviceDoc.subscriptions) ? serviceDoc.subscriptions : []

    // 2) Mark the correct sub as inactive
    const foundIndex = subs.findIndex((sub: any) => {
        const shopValue = typeof sub.shop === 'object' ? sub.shop?.id : sub.shop
        const tenantValue = typeof sub.tenant === 'object' ? sub.tenant?.id : sub.tenant
        return (
            shopValue === shopId &&
            tenantValue === tenantId &&
            sub.stripeSubscriptionId === stripeSubscriptionId
        )
    })

    if (foundIndex > -1) {
        subs[foundIndex].active = false
    }

    // 3) Update the service doc
    await payload.update({
        collection: 'services',
        id: serviceId,
        data: {
            subscriptions: subs,
        },
    })

    // 4) Check if the user still has an **active** subscription for this service
    const stillActive = subs.some((sub: any) => {
        const shopValue = typeof sub.shop === 'object' ? sub.shop?.id : sub.shop
        const tenantValue = typeof sub.tenant === 'object' ? sub.tenant?.id : sub.tenant
        return shopValue === shopId && tenantValue === tenantId && sub.active
    })

    if (!stillActive) {
        // They have no more active subscription for that (service, tenant, shop) combination
        // => Possibly remove roles. BUT you must decide how to handle partial shops vs. user-level roles.
        //    Some teams prefer removing roles if *none* of the user’s shops are active, etc.
        //    For example, check if user has ANY active sub for this service at all:
        const anyActiveForThisService = subs.some((sub: any) => sub.active)

        if (!anyActiveForThisService) {
            // No active subs for this user/tenant => remove the service’s roles from user
            const serviceRoleIDs = Array.isArray(serviceDoc.roles)
                ? serviceDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
                : []

            // Fetch the user doc
            const userDoc = await payload.findByID({
                collection: 'users',
                id: userId,
            })
            if (!userDoc) {
                console.warn('User not found in deactivateSubscription')
                return
            }

            const userRoleIDs = Array.isArray(userDoc.roles)
                ? userDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
                : []

            // Remove the service roles
            const updatedRoles = userRoleIDs.filter(
                (roleId: string) => !serviceRoleIDs.includes(roleId),
            )

            await payload.update({
                collection: 'users',
                id: userId,
                data: { roles: updatedRoles },
            })
        }
    }
}
