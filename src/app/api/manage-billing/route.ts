// File: /src/app/api/manage-billing/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const { tenantId } = await req.json()

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
        }

        // 1) Fetch the tenant doc
        const tenantDoc = await payload.findByID({
            collection: 'tenants',
            id: tenantId,
        })
        if (!tenantDoc) {
            return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
        }

        // 2) Check if there's a stripeCustomerId on this tenant
        const stripeCustomerId = tenantDoc.stripeCustomerId
        if (!stripeCustomerId) {
            return NextResponse.json({ error: 'No stripeCustomerId on tenant.' }, { status: 400 })
        }

        // 3) Create Stripe Portal session
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        })
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/services`,
            // or any other page you'd like to return to
        })

        // 4) Send the URL to the client
        return NextResponse.json({ url: portalSession.url })
    } catch (err: any) {
        console.error('ManageBilling error:', err)
        return NextResponse.json({ error: err?.message || 'Something went wrong' }, { status: 500 })
    }
}
