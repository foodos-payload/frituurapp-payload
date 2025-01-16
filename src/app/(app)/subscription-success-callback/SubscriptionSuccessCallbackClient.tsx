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
        // On client mount, grab query params and call our new API route
        async function processSubscription() {
            try {
                const service_id = searchParams.get("service_id")
                const user_id = searchParams.get("user_id")
                const amount = searchParams.get("amount")
                const rolesParam = searchParams.get("roles") // e.g. "roleID1,roleID2"
                const shop_id = searchParams.get("shop_id") // if needed

                if (!service_id || !user_id) {
                    throw new Error("Missing required params: service_id or user_id")
                }

                // Convert roles from comma-delimited string to array if needed
                const roles = rolesParam ? rolesParam.split(",") : []

                // Call our NEW /api/manage-subscriptions (or whatever your route is named)
                const response = await fetch("/api/manage-subscriptions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        serviceId: service_id,
                        userId: user_id,
                        amount,
                        roles,
                        shopId: shop_id,
                    }),
                })

                if (!response.ok) {
                    const msg = await response.json()
                    throw new Error(
                        msg?.error || `Error: ${response.status} - ${response.statusText}`
                    )
                }
            } catch (err: any) {
                console.error("Error managing subscription:", err)
                setError(err.message || "Unknown error")
            } finally {
                setIsLoading(false)
            }
        }

        processSubscription()
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
