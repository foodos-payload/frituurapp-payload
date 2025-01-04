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
    // Instead of one `isLoading`, let's separate "initial load" vs. silent poll.
    const [isInitialLoading, setIsInitialLoading] = useState(true)

    const [preparationOrders, setPreparationOrders] = useState<Order[]>([])
    const [readyOrders, setReadyOrders] = useState<Order[]>([])

    // We won't set `isInitialLoading` to true again on poll,
    // so the UI won't flicker for subsequent polls.
    const pollingRef = useRef<IntervalID | null>(null)

    const [adImage, setAdImage] = useState<string | null>(null)

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Fetch Orders (no flicker on subsequent polls)
    // ─────────────────────────────────────────────────────────────────────────────
    async function fetchOrders(isInitial: boolean) {
        try {
            if (isInitial) {
                setIsInitialLoading(true)
            }
            const url = `/api/orders?host=${encodeURIComponent(hostSlug)}`
            const res = await fetch(url, { cache: "no-store" })
            if (!res.ok) {
                throw new Error(`Order fetch failed with status ${res.status}`)
            }

            // Example response shape: { orders: [ { id, tempOrdNr, status, ... }, ... ] }
            const data = (await res.json()) as {
                orders: Order[]
            }

            const inPrep: Order[] = []
            const completed: Order[] = []

            // Filter / separate into arrays based on status
            const now = new Date()
            for (const o of data.orders) {
                if (o.status === "in_preparation") {
                    inPrep.push(o)
                } else if (o.status === "complete" || o.status === "completed") {
                    // Optionally filter out if older than 15 minutes
                    const completedStr = o.completedAt ?? o.updatedAt
                    if (completedStr) {
                        const orderCompletedDate = new Date(completedStr)
                        const diffInMinutes = (now.getTime() - orderCompletedDate.getTime()) / 60000
                        if (diffInMinutes <= 15) {
                            completed.push(o)
                        }
                    }
                }
            }

            setPreparationOrders(inPrep)
            setReadyOrders(completed)
        } catch (err) {
            console.error("Error fetching orders:", err)
            // handle error if needed
        } finally {
            if (isInitial) {
                setIsInitialLoading(false)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) Effect: first load + polling
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // First load => show spinner => fetch
        fetchOrders(true)

        // Start polling silently
        pollingRef.current = setInterval(() => {
            // On subsequent polls => no flicker
            fetchOrders(false)
        }, 5000)

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
            }
        }
    }, [hostSlug])

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) Fetch Branding
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const brandingUrl = `/api/branding?host=${encodeURIComponent(hostSlug)}`
        fetch(brandingUrl, { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                const maybeAd = data?.branding?.adImage?.s3_url
                setAdImage(maybeAd || null)
            })
            .catch((err) => {
                console.error("Error fetching branding:", err)
                setAdImage(null)
            })
    }, [hostSlug])

    // For layout convenience
    const hasAd = adImage !== null

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) Render
    // ─────────────────────────────────────────────────────────────────────────────
    // a) If initial loading
    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <p className="text-lg font-semibold">Loading orders...</p>
            </div>
        )
    }

    // b) Normal state
    return (
        <div className={`flex w-full h-screen ${hasAd ? "justify-between" : "justify-center"}`}>
            {/* Left Panel (In Preparation) */}
            <div className={`${hasAd ? "w-1/3" : "w-1/2"} flex flex-col h-full`} style={{ backgroundColor: "#e0e0e0" }}>
                {/* Move header to top */}
                <h2 className="bg-gray-700 text-white p-4 text-center text-3xl font-bold m-0">
                    In Preparation
                </h2>

                {/* List */}
                <div className="flex flex-col flex-grow p-5 overflow-auto">
                    {preparationOrders.length < 1 ? (
                        <p className="mt-4 text-center text-lg text-gray-600"></p>
                    ) : (
                        <ul className="mt-4 grid grid-cols-2 gap-4">
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

            {/* Middle / Right Panel (Ready) */}
            <div className={`${hasAd ? "w-1/3" : "w-1/2"} flex flex-col h-full`} style={{ backgroundColor: "#f0f2f5" }}>
                <h2 className="bg-green-600 text-white p-4 text-center text-3xl font-bold m-0">
                    Ready
                </h2>

                <div className="flex flex-col flex-grow p-5 overflow-auto">
                    {readyOrders.length < 1 ? (
                        <p className="mt-4 text-center text-lg text-gray-600"></p>
                    ) : (
                        <ul className="mt-4">
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

            {/* Optional Ad Panel */}
            {hasAd && (
                <div className="w-1/3 bg-gray-100 flex items-center justify-center p-0">
                    <img
                        src={adImage || ""}
                        alt="Advertisement"
                        className="w-full h-full object-contain"
                    />
                </div>
            )}
        </div>
    )
}
