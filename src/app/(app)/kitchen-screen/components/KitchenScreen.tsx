// File: src/app/(app)/kitchen-screen/components/KitchenScreen.tsx
"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { TopBar } from "./TopBar"
import { OrderCard } from "../components/OrderCard/index"
import { SkeletonOrderCard } from "./SkeletonOrderCard"

type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "complete"
    | "done"

interface PaymentMethod {
    provider?: string
}
interface PaymentEntry {
    payment_method?: PaymentMethod
    amount?: number
}

interface OrderDetail {
    id: string
    quantity: number
    price?: number
    product: {
        name_nl?: string
    }
}
interface Order {
    fulfillment_method: string
    order_type: string
    id: number
    status: OrderStatus
    tempOrdNr?: number
    order_details: OrderDetail[]
    payments?: PaymentEntry[]
    customer_note?: string
}

interface KitchenScreenProps {
    hostSlug: string
}

export default function KitchenScreen({ hostSlug }: KitchenScreenProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [view, setView] = useState<"active" | "archived">("active")
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // For the top bar counters
    const [activeCount, setActiveCount] = useState(0)
    const [archivedCount, setArchivedCount] = useState(0)

    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // ─────────────────────────────────────────────────────────────────────────────
    // A) fetchCounts => separate calls for active + archived for the top bar
    // ─────────────────────────────────────────────────────────────────────────────
    const fetchCounts = useCallback(async () => {
        try {
            // Active
            const activeUrl = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=active&page=1`
            const rA = await fetch(activeUrl, { cache: "no-store" })
            if (rA.ok) {
                const dataA = await rA.json()
                setActiveCount(dataA.orders?.length || 0)
            }

            // Archived
            const archUrl = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=archived&page=1`
            const rB = await fetch(archUrl, { cache: "no-store" })
            if (rB.ok) {
                const dataB = await rB.json()
                setArchivedCount(dataB.orders?.length || 0)
            }
        } catch (err) {
            console.error("Error fetching counts:", err)
        }
    }, [hostSlug])

    // ─────────────────────────────────────────────────────────────────────────────
    // B) fetchOrders => main list
    // ─────────────────────────────────────────────────────────────────────────────
    const fetchOrders = useCallback(
        async (resetPage: boolean) => {
            try {
                setIsLoading(true)
                let targetPage = page
                if (resetPage) {
                    targetPage = 1
                    setPage(1)
                }

                const url = `/api/orders?host=${encodeURIComponent(hostSlug)}&view=${view}&page=${targetPage}`
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

                // 2) Now proceed to set our local state
                if (resetPage) {
                    setOrders(fetched)
                    setHasMore(fetched.length >= 50)
                } else {
                    setOrders(prev => [...prev, ...fetched])
                    if (fetched.length < 50) setHasMore(false)
                }
            } catch (err) {
                console.error("Error fetching orders:", err)
            } finally {
                setIsInitialLoad(false)
                setIsLoading(false)
            }
        },
        [hostSlug, view, page]
    )


    // ─────────────────────────────────────────────────────────────────────────────
    // C) On mount => fetch orders, fetch counts, start polling
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchOrders(true) // initial (reset)
        fetchCounts()
        pollRef.current = setInterval(() => {
            fetchCounts()
            fetchOrders(true)
        }, 5000)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [fetchCounts, fetchOrders])

    // ─────────────────────────────────────────────────────────────────────────────
    // D) loadMore => increment page => fetch more
    // ─────────────────────────────────────────────────────────────────────────────
    async function loadMore() {
        setPage(prev => prev + 1)
        await fetchOrders(false)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // E) Mark order ready => set status=complete => remove local
    // ─────────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────────
    // F) Recover => set status=in_preparation => remove local => switch view to active
    // ─────────────────────────────────────────────────────────────────────────────
    async function recoverOrder(orderId: number) {
        try {
            await fetch(`/api/orders/recover?host=${encodeURIComponent(hostSlug)}&orderId=${orderId}`, {
                method: "POST",
            })
            // remove local
            setOrders(prev => prev.filter(o => o.id !== orderId))
            // increment active, decrement archived
            setActiveCount(c => c + 1)
            setArchivedCount(c => (c > 0 ? c - 1 : 0))
            // auto-switch to active
            setView("active")
        } catch (err) {
            console.error("Error recovering order:", err)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // G) Switch between active/archived => refetch
    // ─────────────────────────────────────────────────────────────────────────────
    function handleSetView(nextView: "active" | "archived") {
        setView(nextView)
        setOrders([])
        setHasMore(true)
        setIsInitialLoad(true)
        fetchOrders(true)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // H) printOrder => console or real print call
    // ─────────────────────────────────────────────────────────────────────────────
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
                            onRecoverOrder={view === "archived" ? recoverOrder : undefined}
                            printOrder={printOrder}
                            markOrderReady={view === "active" ? markOrderReady : undefined}
                        />
                    ))}
            </div>

            {hasMore && !isInitialLoad && !isLoading && (
                <button
                    onClick={loadMore}
                    className="mt-5 px-6 py-3 bg-green-600 text-white rounded self-center hover:bg-green-700"
                >
                    Load More
                </button>
            )}
        </div>
    )
}
