// File: /src/app/api/manage-billing/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const { userId } = await req.json()

        // Basic check
        if (!userId) {
            return NextResponse.json({ error: 'Missing `userId`' }, { status: 400 })
        }

        // 1) Fetch the user by ID
        const userDoc = await payload.findByID({
            collection: 'users',
            id: userId,
        })
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        // 2) Check if the user has an associated stripeCustomerId
        if (!userDoc.stripeCustomerId) {
            return NextResponse.json({ error: 'No stripeCustomerId on user' }, { status: 400 })
        }

        // 3) Create the Stripe Billing Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: userDoc.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/services`,
        })

        // 4) Return the portal session URL
        return NextResponse.json({ url: portalSession.url })

    } catch (err: any) {
        console.error('Error creating billing portal:', err)
        return NextResponse.json(
            { error: err?.message ?? 'Something went wrong' },
            { status: 500 },
        )
    }
}
