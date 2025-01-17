// File: /src/app/api/retrieve-checkout-session/route.ts
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
    try {
        const { sessionId } = await req.json()
        if (!sessionId) {
            return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
        }

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        // The subscription ID is found at session.subscription
        // Type can be string | null
        const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null

        return NextResponse.json({ subscriptionId })
    } catch (error: any) {
        console.error("Error retrieving checkout session from Stripe:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
