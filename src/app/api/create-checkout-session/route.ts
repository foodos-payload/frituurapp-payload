// File: /src/app/api/create-checkout-session/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import config from '@payload-config'

// We'll assume the request includes { price, userId, successUrl, cancelUrl }

export async function POST(req: Request) {
    try {
        // 1) Parse the request
        const payload = await getPayload({ config })
        const body = await req.json()
        const { price, serviceId, userId, successUrl, cancelUrl } = body

        // Basic checks
        if (!price) {
            return NextResponse.json({ error: 'Missing `price` in request.' }, { status: 400 })
        }
        if (!userId) {
            return NextResponse.json({ error: 'Missing `userId` in request.' }, { status: 400 })
        }

        // 2) Fetch the user
        const userDoc = await payload.findByID({
            collection: 'users',
            id: userId,
        })
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        // 3) Check for existing stripeCustomerId
        let stripeCustomerId = userDoc.stripeCustomerId
        if (!stripeCustomerId) {
            // Create new Stripe Customer
            const newCustomer = await stripe.customers.create({
                email: userDoc.email,
                // You can pass more fields: name, phone, metadata, ...
            })
            stripeCustomerId = newCustomer.id

            // 4) Save that to the user doc
            await payload.update({
                collection: 'users',
                id: userDoc.id,
                data: {
                    stripeCustomerId: stripeCustomerId,
                },
            })
        }

        // 5) Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId, // use the existing or newly-created customer
            line_items: [
                {
                    price,
                    quantity: 1,
                },
            ],
            subscription_data: {
                metadata: {
                    serviceId: serviceId,
                    userId: userId,
                },
            },
            success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
        })

        // Return the session ID so the client can redirect
        return NextResponse.json({ sessionId: session.id })
    } catch (error: any) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
            { error: error?.message || 'Error creating checkout session' },
            { status: 500 },
        )
    }
}
