// File: /src/app/api/stripe-webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import config from '@payload-config'
import type StripeType from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: Request) {
    try {
        const payloadBuffer = Buffer.from(await req.arrayBuffer())
        const sig = req.headers.get('stripe-signature')
        if (!sig || !endpointSecret) {
            return NextResponse.json({ error: 'Webhook signature or secret missing' }, { status: 400 })
        }

        let event: StripeType.Event
        try {
            event = stripe.webhooks.constructEvent(payloadBuffer, sig, endpointSecret)
        } catch (err: any) {
            console.error('Stripe webhook signature verification failed:', err)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        switch (event.type) {
            case 'customer.subscription.updated': {
                const subscription = event.data.object as StripeType.Subscription
                await handleSubscriptionUpdated(subscription)
                break
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as StripeType.Subscription
                await handleSubscriptionDeleted(subscription)
                break
            }
            default:
                console.log('Unhandled event type:', event.type)
                break
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('Stripe webhook error:', err)
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}

async function handleSubscriptionUpdated(subscription: StripeType.Subscription) {
    const payload = await getPayload({ config })
    const {
        id: stripeSubscriptionId,
        status,
        cancel_at_period_end,
        current_period_end,
    } = subscription

    // 1) Find the service doc
    const services = await payload.find({
        collection: 'services',
        where: {
            'subscriptions.stripeSubscriptionId': {
                equals: stripeSubscriptionId,
            },
        },
        limit: 1,
    })
    const serviceDoc = services.docs[0]
    if (!serviceDoc) {
        console.warn(`No service doc found with subscriptionId=${stripeSubscriptionId}`)
        return
    }

    // 2) Update subscriptions array
    const updatedSubs = serviceDoc.subscriptions.map((sub: any) => {
        if (sub.stripeSubscriptionId === stripeSubscriptionId) {
            return {
                ...sub,
                status, // if Stripe just switched to 'canceled', store that
                cancel_at_period_end,
                current_period_end: current_period_end
                    ? new Date(current_period_end * 1000).toISOString()
                    : null,
            }
        }
        return sub
    })

    await payload.update({
        collection: 'services',
        id: serviceDoc.id,
        data: {
            subscriptions: updatedSubs,
        },
    })

    // 3) If the status is now 'canceled', remove roles from user(s).
    //    But which user? 
    //    - Typically, you stored the userId in the subscription object or
    //      you can store the shop ID and look up which user(s) might be associated with that shop.
    //    - If you do store it in the subscription object, you can retrieve it here:
    //
    // e.g. sub: { shopId, userId, status, ... }
    //    const subMatch = updatedSubs.find(sub => sub.stripeSubscriptionId === stripeSubscriptionId)
    //    if (subMatch && status === 'canceled') {
    //      removeRolesFromUser(subMatch.userId, serviceDoc.roles, payload)
    //    }
    if (status === 'canceled') {
        // Example: you might have stored 'userId' in that subscription item
        // or do some other method to find the user
        await removeRolesFromAllAssociatedUsers(
            stripeSubscriptionId,
            serviceDoc,
            payload,
        )
    }
}

/**
 * Example pseudo-code to remove roles from a user if you want immediate revocation.
 */
async function removeRolesFromAllAssociatedUsers(
    stripeSubId: string,
    serviceDoc: any,
    payload: Payload,
) {
    // 1) find the subscription array item
    const subItem = serviceDoc.subscriptions.find((sub: any) => sub.stripeSubscriptionId === stripeSubId)
    if (!subItem) return

    const { userId } = subItem
    if (!userId) return

    // 2) fetch the user
    const userDoc = await payload.findByID({
        collection: 'users',
        id: userId,
    })
    if (!userDoc) return

    // 3) remove the serviceDoc’s roles from user’s top-level roles
    const serviceRoleIDs = Array.isArray(serviceDoc.roles)
        ? serviceDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []
    const userRoleIDs = Array.isArray(userDoc.roles)
        ? userDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []

    // filter out the serviceRoleIDs
    const rolesAfterRemoval = userRoleIDs.filter((roleID: string) => !serviceRoleIDs.includes(roleID))

    // 4) update user
    await payload.update({
        collection: 'users',
        id: userId,
        data: {
            roles: rolesAfterRemoval,
        },
    })
}


async function handleSubscriptionDeleted(subscription: StripeType.Subscription) {
    const payload = await getPayload({ config })
    const { id: stripeSubscriptionId } = subscription

    // 1) Find the service doc with this subscription
    const services = await payload.find({
        collection: 'services',
        where: {
            'subscriptions.stripeSubscriptionId': {
                equals: stripeSubscriptionId,
            },
        },
        limit: 1,
    })
    const serviceDoc = services.docs[0]
    if (!serviceDoc) {
        console.warn(`No service doc found with subscriptionId=${stripeSubscriptionId}`)
        return
    }

    // 2) Instead of removing it, just set status=canceled
    const updatedSubs = serviceDoc.subscriptions.map((sub: any) => {
        if (sub.stripeSubscriptionId === stripeSubscriptionId) {
            return {
                ...sub,
                status: 'canceled',
            }
        }
        return sub
    })

    await payload.update({
        collection: 'services',
        id: serviceDoc.id,
        data: {
            subscriptions: updatedSubs,
        },
    })
}
