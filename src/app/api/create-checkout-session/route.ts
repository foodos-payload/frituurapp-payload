import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'

export async function POST(request: Request) {
    const payload = await getPayload({ config })
    try {
        const body = await request.json()
        const {
            price,
            userId,
            customerEmail,
            serviceId,
            shopId,
            successUrl,
            cancelUrl,
            tenantId,
        } = body

        if (!price || !userId || !serviceId || !shopId) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
        }
        console.log(userId)
        // 1) Fetch the user doc to figure out tenant
        const userDoc = await payload.findByID({
            collection: 'users',
            id: userId,
        })
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }


        // 2) Validate that user is tenant-admin for the passed tenantId
        const userTenants = Array.isArray(userDoc.tenants) ? userDoc.tenants : []
        const matchingTenant = userTenants.find((entry: any) => {
            const tID = typeof entry.tenant === 'object' ? entry.tenant?.id : entry.tenant
            return tID === tenantId && entry.roles?.includes('tenant-admin')
        })
        if (!matchingTenant) {
            return NextResponse.json(
                { error: 'User is not tenant-admin for the provided tenantId.' },
                { status: 403 },
            )
        }
        // 3) Fetch the service doc
        const serviceDoc = await payload.findByID({
            collection: 'services',
            id: serviceId,
        })

        if (!serviceDoc) {
            return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
        }

        // 4) Check if there's already a subscription item for this shop
        const existingSubs = Array.isArray(serviceDoc.subscriptions)
            ? serviceDoc.subscriptions
            : []
        const alreadyExists = existingSubs.some((sub: any) => {
            const shopValue = typeof sub.shop === 'object' ? sub.shop?.id : sub.shop
            const tenantValue = typeof sub.tenant === 'object' ? sub.tenant?.id : sub.tenant
            return shopValue === shopId && tenantValue === tenantId
        })

        if (!alreadyExists) {
            existingSubs.push({
                tenant: tenantId,
                shop: shopId,
                stripeSubscriptionId: '',
                active: false,
            })

            await payload.update({
                collection: 'services',
                id: serviceId,
                data: {
                    subscriptions: existingSubs,
                },
            })
        }

        // NEW: 4.5 Fetch the tenant doc to see if stripeCustomerId already exists
        const tenantDoc = await payload.findByID({
            collection: 'tenants',
            id: tenantId,
        })
        const existingCustomer = tenantDoc?.stripeCustomerId || undefined

        // 5) Create Stripe session
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2022-11-15',
        })

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price,
                    quantity: 1,
                },
            ],
            // customer_email: customerEmail,
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer: existingCustomer,

            // 1) Set metadata on the session
            metadata: {
                service_id: serviceId,
                shop_id: shopId,
                tenant_id: tenantId,
                user_id: userId,
            },

            // 2) Also set subscription_data.metadata so the Subscription itself has this info
            subscription_data: {
                metadata: {
                    service_id: serviceId,
                    shop_id: shopId,
                    tenant_id: tenantId,
                    user_id: userId,
                },
            },
        })


        return NextResponse.json({ sessionId: session.id })
    } catch (err: any) {
        console.error('Error creating checkout session:', err)
        return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 })
    }
}
