'use client'

import { Button } from "@/components/ui/button"
import { ButtonProps } from "@/components/ui/button"
import { useState } from "react"
import { loadStripe } from '@stripe/stripe-js';
import { Role, User } from "@/payload-types";
interface SubscribeButtonProps extends ButtonProps {
    priceId: string | undefined
    id: string | undefined
    amount: string | undefined
    user?: User | undefined
    serviceRole?: Role | undefined
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function SubscribeButton({ priceId, children, id, user, serviceRole, amount, ...props }: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    async function handleSubscribe() {
        try {
            if (!priceId) {
                console.error('No price ID provided');
                return;
            }

            const stripe = await stripePromise;
            if (!stripe) {
                console.error('Stripe is not loaded');
                return;
            }
            // Call your backend to create the session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price: priceId,  // Pass your Stripe Price ID here
                    customerEmail: user?.email, // Optionally pass a customer email
                    successUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/subscription-success-callback?service_id=${id}&user_id=${user?.id}&amount=${amount}&role=${serviceRole?.id}`,
                    cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/services/${id}`,
                }),
            });

            const session = await response.json();
            console.log(session)
            // Redirect to Stripe Checkout
            await stripe.redirectToCheckout({ sessionId: session.sessionId });
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            className="w-full bg-black text-white hover:bg-black/80 rounded-md hover:text-white"
            onClick={handleSubscribe}
            disabled={isLoading || !priceId}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </Button>
    )
} 