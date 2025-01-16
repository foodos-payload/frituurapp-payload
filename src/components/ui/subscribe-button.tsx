"use client"

import { Button } from "@/components/ui/button"
import { ButtonProps } from "@/components/ui/button"
import { useState } from "react"
import { loadStripe } from '@stripe/stripe-js';
import { Role, User } from "@/payload-types";

// This interface is the same as before, except we now assume `user` might have "shops".
interface SubscribeButtonProps extends ButtonProps {
    priceId: string | undefined
    id: string | undefined       // The service ID
    amount: string | undefined
    user?: User | undefined
    serviceRoles: Role[];
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function SubscribeButton({
    priceId,
    children,
    id,
    user,
    serviceRoles,
    amount,
    ...props
}: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    // 1) We add a select for shop
    const [selectedShopId, setSelectedShopId] = useState<string>("")

    // Safety checks:
    const userId = user?.id || ""          // fallback to empty if undefined
    const userShops = Array.isArray(user?.shops) ? user!.shops : []
    console.log(user)

    async function handleSubscribe() {
        try {
            setIsLoading(true)

            if (!priceId) {
                console.error('No price ID provided');
                return;
            }

            if (!selectedShopId) {
                alert("Please select a shop before subscribing.")
                return;
            }

            const stripe = await stripePromise;
            if (!stripe) {
                console.error('Stripe is not loaded');
                return;
            }

            // 2) Build successUrl that includes shop_id
            // Also pass user_id, so you know who is purchasing
            const successUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/subscription-success-callback?` +
                `service_id=${id}&` +
                `user_id=${userId}&` +
                `shop_id=${selectedShopId}&` +
                `amount=${amount}&` +
                `roles=${serviceRoles.map(role => role.id).join(",")}`

            // 3) Create the checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: priceId,
                    customerEmail: user?.email,
                    successUrl, // we built above
                    cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/services/${id}`,
                }),
            });

            if (!response.ok) {
                const msg = await response.json()
                throw new Error(msg?.error || "Failed to create checkout session.")
            }
            const session = await response.json()
            if (!session?.sessionId) {
                throw new Error("Stripe sessionId missing in response.")
            }

            // 4) Redirect to Stripe Checkout
            await stripe.redirectToCheckout({ sessionId: session.sessionId });
        } catch (error) {
            console.error('Error:', error)
            alert(error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            {/* 5) Shop Selector */}
            <label htmlFor="shop-select" className="mb-1 block">
                Which Shop?
            </label>
            <select
                id="shop-select"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="border border-gray-300 rounded-md p-1 w-full mb-2"
            >
                <option value="">-- Select a Shop --</option>
                {userShops.map((shop: any) => {
                    // If your user.shops is an array of objects that includes { id, name },
                    // you can do something like:
                    const shopId = typeof shop === 'string' ? shop : shop.id
                    const shopName = typeof shop === 'string' ? shop : (shop.name || shopId)

                    return (
                        <option key={shopId} value={shopId}>
                            {shopName}
                        </option>
                    )
                })}
            </select>

            {/* 6) The Subscribe Button */}
            <Button
                className="w-full bg-black text-white hover:bg-black/80 rounded-md hover:text-white"
                onClick={handleSubscribe}
                disabled={isLoading || !priceId}
                {...props}
            >
                {isLoading ? 'Loading...' : children}
            </Button>
        </div>
    )
}
