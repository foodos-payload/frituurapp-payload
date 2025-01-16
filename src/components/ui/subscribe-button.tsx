"use client"

import { Button } from "@/components/ui/button"
import { ButtonProps } from "@/components/ui/button"
import { useState } from "react"
import { loadStripe } from '@stripe/stripe-js';
import { Role, User } from "@/payload-types"

// SubscribeButtonProps no longer needs internal "selectedShopId" logic
interface SubscribeButtonProps extends ButtonProps {
    priceId?: string      // The Stripe price ID
    id?: string          // The service ID
    amount?: string
    user?: User
    serviceRoles: Role[]
    // The shop ID is now passed in from the parent
    shopId?: string
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export function SubscribeButton({
    priceId,
    id,
    amount,
    user,
    serviceRoles,
    shopId,
    children,
    ...props
}: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Basic safety checks
    const userId = user?.id || ""

    async function handleSubscribe() {
        try {
            setIsLoading(true)

            if (!priceId) {
                console.error("No priceId provided")
                return
            }
            if (!shopId) {
                alert("Please select a shop before subscribing.")
                return
            }

            const stripe = await stripePromise
            if (!stripe) {
                console.error("Stripe is not loaded")
                return
            }

            // Build successUrl that includes shop_id, user_id, etc
            const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/subscription-success-callback?` +
                `service_id=${id}&` +
                `user_id=${userId}&` +
                `shop_id=${shopId}&` +
                `amount=${amount}&` +
                `roles=${serviceRoles.map((role) => role.id).join(",")}`

            // Create the checkout session
            const response = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    price: priceId,
                    customerEmail: user?.email,
                    successUrl,
                    cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/services/${id}`,
                }),
            })

            if (!response.ok) {
                const msg = await response.json()
                throw new Error(msg?.error || "Failed to create checkout session.")
            }

            const session = await response.json()
            if (!session?.sessionId) {
                throw new Error("Stripe sessionId missing in response.")
            }

            // Redirect to Stripe Checkout
            await stripe.redirectToCheckout({ sessionId: session.sessionId })
        } catch (error) {
            console.error("Error:", error)
            alert(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            {...props}
            onClick={handleSubscribe}
            disabled={isLoading || !priceId || props.disabled}
        >
            {isLoading ? "Loading..." : children}
        </Button>
    )
}
