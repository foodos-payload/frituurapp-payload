"use client"

import React, { useEffect, useState, useRef } from "react"

type IntervalID = ReturnType<typeof setInterval>

interface Order {
    id: string
    tempOrdNr?: number
    status?: string
    updatedAt?: string
    completedAt?: string
}

interface OrderStatusPageProps {
    hostSlug: string
}

export function OrderStatusPage({ hostSlug }: OrderStatusPageProps) {
    const [preparationOrders, setPreparationOrders] = useState<Order[]>([])
    const [readyOrders, setReadyOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const pollingRef = useRef<IntervalID | null>(null)

    const [adImage, setAdImage] = useState<string | null>(null)

    async function fetchOrders() {
        try {
            setIsLoading(true)

            const url = `/api/orders?host=${encodeURIComponent(hostSlug)}`
            const res = await fetch(url, { cache: "no-store" })
            if (!res.ok) {
                throw new Error(`Order fetch failed with status ${res.status}`)
            }
            const data = (await res.json()) as {
                inPreparation: Order[]
                completed: Order[]
            }

            const now = new Date()
            const freshCompleted = data.completed.filter((order) => {
                const completedStr = order.completedAt ?? order.updatedAt
                if (!completedStr) return false

                const orderCompletedDate = new Date(completedStr)
                const diffInMinutes = (now.getTime() - orderCompletedDate.getTime()) / 60000
                return diffInMinutes <= 15
            })

            setPreparationOrders(data.inPreparation)
            setReadyOrders(freshCompleted)
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching orders:", error)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
        pollingRef.current = setInterval(fetchOrders, 5000)

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [hostSlug])

    useEffect(() => {
        const brandingUrl = `/api/branding?host=${encodeURIComponent(hostSlug)}`
        fetch(brandingUrl, { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                const maybeAd = data?.branding?.adImage?.s3_url
                if (maybeAd) {
                    setAdImage(maybeAd)
                } else {
                    setAdImage(null)
                }
            })
            .catch((err) => {
                console.error("Error fetching branding:", err)
                setAdImage(null)
            })
    }, [hostSlug])

    const hasAd = adImage !== null

    return (
        <div
            className={`flex h-screen ${hasAd ? "justify-between" : "justify-center"
                }`}
        >
            <div className={hasAd ? "w-1/3" : "w-1/2"} style={{ backgroundColor: "#e0e0e0" }}>
                <div className="flex flex-col p-5 h-full">
                    <h2 className="bg-gray-700 text-white p-4 rounded-b-[35px] text-center text-3xl font-bold">
                        In Preparation
                    </h2>
                    {isLoading ? (
                        <p className="mt-4"></p>
                    ) : (
                        <ul className="mt-4 flex-grow grid grid-cols-2 gap-4">
                            {preparationOrders.map((order) => (
                                <li key={order.id} className="mb-4">
                                    <span className="text-3xl font-bold bg-white p-6 rounded-md block text-center">
                                        {order.tempOrdNr ?? "???"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className={hasAd ? "w-1/3" : "w-1/2"} style={{ backgroundColor: "#f0f2f5" }}>
                <div className="flex flex-col p-5 h-full">
                    <h2 className="bg-green-600 text-white p-4 rounded-b-[35px] text-center text-3xl font-bold">
                        Ready
                    </h2>
                    {isLoading ? (
                        <p className="mt-4"></p>
                    ) : (
                        <ul className="mt-4 flex-grow">
                            {readyOrders.map((order) => (
                                <li key={order.id} className="mb-4">
                                    <span className="text-3xl font-bold bg-white p-6 rounded-md block text-green-600 text-center">
                                        {order.tempOrdNr ?? "???"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {hasAd && (
                <div className="w-1/3 bg-gray-100 flex items-center justify-center p-0">
                    <img
                        src={adImage ?? ""}
                        alt="Advertisement"
                        className="w-full h-full object-contain"
                    />
                </div>
            )}
        </div>
    )
}
