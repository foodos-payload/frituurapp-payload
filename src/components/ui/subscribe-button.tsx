'use client'

import { Button } from "@/components/ui/button"
import { ButtonProps } from "@/components/ui/button"
import { useState } from "react"
import { loadStripe } from '@stripe/stripe-js';
interface SubscribeButtonProps extends ButtonProps {
    priceId: string | undefined
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function SubscribeButton({ priceId, children, ...props }: SubscribeButtonProps) {
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
                    customerEmail: 'customer@example.com', // Optionally pass a customer email
                    successUrl: 'http://localhost:3000/services',
                    cancelUrl: 'http://localhost:3000/services',
                }),
            });

            const session = await response.json();

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