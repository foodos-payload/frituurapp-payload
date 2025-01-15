// File: /src/app/(app)/subscription-success-callback/SubscriptionSuccessCallbackClient.tsx

"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function SubscriptionSuccessCallbackClient() {
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // On client mount, grab query params and call our API route
        async function updateSubscription() {
            try {
                const service_id = searchParams.get("service_id")
                const user_id = searchParams.get("user_id")
                const amount = searchParams.get("amount")
                const role = searchParams.get("role")

                // Call our API route to update the user in Payload
                const response = await fetch("/api/update-subscription", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        service_id,
                        user_id,
                        amount,
                        role,
                    }),
                })

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} - ${response.statusText}`)
                }
            } catch (err: any) {
                console.error("Error updating subscription:", err)
                setError(err.message || "Unknown error")
            } finally {
                setIsLoading(false)
            }
        }
        updateSubscription()
    }, [searchParams])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Processing your subscription...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md p-8 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <h1 className="text-2xl font-semibold text-red-600">
                            Subscription Error
                        </h1>
                        <p className="text-gray-600">{error}</p>
                        <Button asChild className="mt-6">
                            <Link href="/services">Return to Services</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    // If no error, show success
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Subscription Successful!
                    </h1>
                    <p className="text-gray-600">
                        Thank you for your subscription. Your account has been successfully
                        updated.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/services">Return to Services</Link>
                    </Button>
                </div>
            </Card>
        </div>
    )
}
