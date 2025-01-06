"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { TopBar } from "./TopBar"
import { OrderCard } from "../components/OrderCard"
import { SkeletonOrderCard } from "./SkeletonOrderCard"

import type { Order } from "../types/Order"

interface KitchenScreenProps {
    hostSlug: string
}

export default function KitchenScreen({ hostSlug }: KitchenScreenProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [view, setView] = useState<"active" | "archived">("active")
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    // For the top bar counters
    const [activeCount, setActiveCount] = useState(0)
    const [archivedCount, setArchivedCount] = useState(0)

    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // A) fetchCounts => separate calls for active + archived
    const fetchCounts = useCallback(async () => {
        try {
            // Active
            const activeUrl = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=active`
            const rA = await fetch(activeUrl, { cache: "no-store" })
            if (rA.ok) {
                const dataA = await rA.json()
                setActiveCount(dataA.orders?.length || 0)
            }

            // Archived
            const archUrl = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=archived`
            const rB = await fetch(archUrl, { cache: "no-store" })
            if (rB.ok) {
                const dataB = await rB.json()
                setArchivedCount(dataB.orders?.length || 0)
            }
        } catch (err) {
            console.error("Error fetching counts:", err)
        }
    }, [hostSlug])

    // B) fetchOrders => main list
    const fetchOrders = useCallback(
        async () => {
            try {
                setIsLoading(true)
                const url = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=${view}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) throw new Error(`Fetch error ${res.status}`)
                const data = await res.json()

                const fetched: Order[] = data.orders || []

                // 1) Immediately bump kiosk/dine_in/awaiting_preparation => in_preparation
                for (const ord of fetched) {
                    if (
                        ord.order_type === "kiosk" &&
                        ord.fulfillment_method === "dine_in" &&
                        ord.status === "awaiting_preparation"
                    ) {
                        try {
                            const markUrl = `/api/orders/markInPreparation?host=${encodeURIComponent(
                                hostSlug
                            )}&orderId=${ord.id}`
                            await fetch(markUrl, { method: "POST" })
                            // Also update locally so the UI reflects new status
                            ord.status = "in_preparation"
                        } catch (markErr) {
                            console.error("Error auto-bumping kiosk/dine_in order:", markErr)
                        }
                    }
                }

                setOrders(fetched)
            } catch (err) {
                console.error("Error fetching orders:", err)
            } finally {
                setIsInitialLoad(false)
                setIsLoading(false)
            }
        },
        [hostSlug, view]
    )

    // C) On mount => fetch orders, fetch counts, start polling
    useEffect(() => {
        fetchOrders()
        fetchCounts()
        pollRef.current = setInterval(() => {
            fetchCounts()
            fetchOrders()
        }, 5000)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [fetchCounts, fetchOrders])

    // E) Mark order ready => set status=complete => remove local
    async function markOrderReady(orderId: number) {
        try {
            await fetch(`/api/orders/markComplete?host=${encodeURIComponent(hostSlug)}&orderId=${orderId}`, {
                method: "POST",
            })
            // remove from local
            setOrders(prev => prev.filter(o => o.id !== orderId))
            // increment archived, decrement active
            setArchivedCount(c => c + 1)
            setActiveCount(c => (c > 0 ? c - 1 : 0))
        } catch (err) {
            console.error("Error marking order ready:", err)
        }
    }

    // F) Recover => set status=in_preparation => remove local => switch to active
    async function recoverOrder(orderId: number) {
        try {
            await fetch(`/api/orders/recoverOrder?host=${encodeURIComponent(hostSlug)}&orderId=${orderId}`, {
                method: "POST",
            })
            // remove from local
            setOrders(prev => prev.filter(o => o.id !== orderId))
            // increment active, decrement archived
            setActiveCount(c => c + 1)
            setArchivedCount(c => (c > 0 ? c - 1 : 0))
            setView("active")
        } catch (err) {
            console.error("Error recovering order:", err)
        }
    }

    // G) Switch between active/archived => refetch
    function handleSetView(nextView: "active" | "archived") {
        setView(nextView)
        setOrders([])
        setIsInitialLoad(true)
        fetchOrders()
    }

    // H) printOrder => console or real print call
    async function printOrder(orderId: number, type: "kitchen" | "customer" | "both") {
        try {
            console.log(`Printing order #${orderId} as ${type}...`)
            // call your real print logic
        } catch (err) {
            console.error("Print error:", err)
        }
    }

    return (
        <div className="flex flex-col p-4 w-full max-w-[1600px] mx-auto">
            <TopBar
                currentView={view}
                setCurrentView={handleSetView}
                activeCount={activeCount}
                archivedCount={archivedCount}
            />

            <div className="order-list grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {isInitialLoad
                    ? [1, 2, 3].map(n => <SkeletonOrderCard key={n} />)
                    : orders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            hostSlug={hostSlug}
                            onRecoverOrder={view === "archived" ? recoverOrder : undefined}
                            printOrder={printOrder}
                            markOrderReady={view === "active" ? markOrderReady : undefined}
                        />
                    ))}
            </div>
        </div>
    )
}
