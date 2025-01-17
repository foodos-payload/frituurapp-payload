// File: /src/app/api/stripe-webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload' // needed for removeRolesFromAllAssociatedUsers signature
import type StripeType from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: Request) {
    try {
        const payloadBuffer = Buffer.from(await req.arrayBuffer())
        const sig = req.headers.get('stripe-signature')
        if (!sig || !endpointSecret) {
            return NextResponse.json(
                { error: 'Webhook signature or secret missing' },
                { status: 400 },
            )
        }

        let event: StripeType.Event
        try {
            // 1) Construct the Stripe event
            event = stripe.webhooks.constructEvent(payloadBuffer, sig, endpointSecret)
        } catch (err: any) {
            console.error('Stripe webhook signature verification failed:', err)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // 2) Switch on event.type
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
        metadata,
    } = subscription

    console.log(
        `handleSubscriptionUpdated: subID=${stripeSubscriptionId}, status=${status}, ` +
        `serviceId=${metadata?.serviceId}`
    )

    // (A) If you prefer searching by subscription ID, do so here:
    // ------------------------------------------------------------------
    //   const services = await payload.find({
    //     collection: 'services',
    //     where: { 'subscriptions.stripeSubscriptionId': { equals: stripeSubscriptionId } },
    //     overrideAccess: true,
    //     limit: 1,
    //   })
    //   if (!services?.docs?.length) { ... }

    // (B) If you prefer reading the doc from subscription.metadata:
    // ------------------------------------------------------------------
    const serviceIdFromMetadata = metadata?.serviceId
    if (!serviceIdFromMetadata) {
        console.warn('No `serviceId` in subscription.metadata; cannot find correct Service doc.')
        return
    }

    // 1) Get the corresponding Service doc by ID
    let serviceDoc
    try {
        serviceDoc = await payload.findByID({
            collection: 'services',
            id: serviceIdFromMetadata,
            overrideAccess: true, // if needed
        })
    } catch (err: any) {
        console.warn(`No service doc found with id=${serviceIdFromMetadata}`, err)
        return
    }
    if (!serviceDoc) {
        console.warn(`No service doc found with serviceId=${serviceIdFromMetadata}`)
        return
    }

    // 2) Update the matching subscriptions array item
    const updatedSubs = (serviceDoc.subscriptions || []).map((sub: any) => {
        if (sub.stripeSubscriptionId === stripeSubscriptionId) {
            return {
                ...sub,
                status,
                cancel_at_period_end,
                current_period_end: current_period_end
                    ? new Date(current_period_end * 1000).toISOString()
                    : null,
            }
        }
        return sub
    })

    // 3) Save back to Payload
    try {
        await payload.update({
            collection: 'services',
            id: serviceDoc.id,
            data: {
                subscriptions: updatedSubs,
            },
            overrideAccess: true,
        })
    } catch (err: any) {
        console.error('Error updating service doc in handleSubscriptionUpdated:', err)
        // do not rethrow => so Stripe sees 200 (received)
    }

    // 4) If now canceled => remove roles from user
    if (status === 'canceled') {
        console.log('Subscription is canceled - removing roles from user(s).')
        await removeRolesFromAllAssociatedUsers(stripeSubscriptionId, serviceDoc, payload)
    }
}

/** Example: immediate revocation of roles when a sub is canceled. */
async function removeRolesFromAllAssociatedUsers(
    stripeSubId: string,
    serviceDoc: any,
    payload: Payload,
) {
    // 1) find the subscription item
    const subItem = Array.isArray(serviceDoc.subscriptions)
        ? serviceDoc.subscriptions.find((s: any) => s.stripeSubscriptionId === stripeSubId)
        : null
    if (!subItem) {
        console.warn('No sub item found matching subID, cannot remove roles.')
        return
    }

    const { userId } = subItem
    if (!userId) {
        console.warn('No userId in subscription item, cannot remove roles.')
        return
    }

    // 2) fetch the user
    const userDoc = await payload.findByID({
        collection: 'users',
        id: userId,
    })
    if (!userDoc) {
        console.warn(`User not found with id=${userId}, cannot remove roles.`)
        return
    }

    // 3) remove the serviceDoc’s roles from userDoc.roles
    const serviceRoleIDs = Array.isArray(serviceDoc.roles)
        ? serviceDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []
    const userRoleIDs = Array.isArray(userDoc.roles)
        ? userDoc.roles.map((r: any) => (typeof r === 'string' ? r : r.id))
        : []
    const rolesAfterRemoval = userRoleIDs.filter((roleID: string) => !serviceRoleIDs.includes(roleID))

    // 4) update user
    try {
        await payload.update({
            collection: 'users',
            id: userId,
            data: {
                roles: rolesAfterRemoval,
            },
        })
        console.log(`Removed service roles from user ${userId}. New roles=`, rolesAfterRemoval)
    } catch (err: any) {
        console.error('Error updating user doc in removeRolesFromAllAssociatedUsers:', err)
    }
}

async function handleSubscriptionDeleted(subscription: StripeType.Subscription) {
    const payload = await getPayload({ config })
    const { id: stripeSubscriptionId, metadata } = subscription

    console.log(`handleSubscriptionDeleted: subID=${stripeSubscriptionId}, serviceId=${metadata?.serviceId}`)

    // (A) If searching by subscriptionId:
    // ----------------------------------------------------------------
    //   const services = await payload.find({
    //     collection: 'services',
    //     where: { 'subscriptions.stripeSubscriptionId': { equals: stripeSubscriptionId } },
    //     overrideAccess: true,
    //     limit: 1,
    //   })
    //   if (!services?.docs?.length) ...
    //   const serviceDoc = services.docs[0]

    // (B) Or use metadata.serviceId:
    // ----------------------------------------------------------------
    if (!metadata?.serviceId) {
        console.warn('No `serviceId` in subscription.metadata for a deleted subscription.')
        return
    }

    let serviceDoc
    try {
        serviceDoc = await payload.findByID({
            collection: 'services',
            id: metadata.serviceId,
            overrideAccess: true,
        })
    } catch (err: any) {
        console.warn(`No service doc found with serviceId=${metadata.serviceId}`, err)
        return
    }
    if (!serviceDoc) {
        console.warn(`No service doc found with serviceId=${metadata.serviceId}`)
        return
    }

    // 2) set the matching item to status='canceled'
    const updatedSubs = (serviceDoc.subscriptions || []).map((sub: any) => {
        if (sub.stripeSubscriptionId === stripeSubscriptionId) {
            return {
                ...sub,
                status: 'canceled',
            }
        }
        return sub
    })

    try {
        await payload.update({
            collection: 'services',
            id: serviceDoc.id,
            data: {
                subscriptions: updatedSubs,
            },
            overrideAccess: true,
        })
    } catch (err: any) {
        console.error('Error updating service doc in handleSubscriptionDeleted:', err)
    }
}
