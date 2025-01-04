"use client"

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react"
import confetti from "canvas-confetti"

type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "complete"
    | "cancelled"

type FulfillmentMethod = "delivery" | "takeaway" | "dine_in" | "unknown"

interface Payment {
    id: string
    payment_method: { id: string; provider?: string }
    amount: number
}

interface OrderDetail {
    id: string
    product: {
        id: string
        name_nl?: string
    }
    quantity: number
    price?: number
    tax?: number
    subproducts?: any[]
}

interface Order {
    id: number
    tempOrdNr?: number
    status: OrderStatus
    fulfillmentMethod?: FulfillmentMethod
    date_created?: string
    customer_note?: string
    order_details?: OrderDetail[]
    payments?: Payment[]
}

interface OrderSummaryPageProps {
    orderId: string
    kioskMode?: boolean
    hostSlug: string
}

export function OrderSummaryPage({
    orderId,
    kioskMode,
    hostSlug,
}: OrderSummaryPageProps) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isPolling, setIsPolling] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [countdown, setCountdown] = useState(30)

    // We'll store the previous status so we can detect transitions
    const previousStatusRef = useRef<OrderStatus | null>(null)

    // For polling
    const pollingRef = useRef<NodeJS.Timeout | null>(null)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Confetti (No Sound)
    // ─────────────────────────────────────────────────────────────────────────────
    const triggerConfetti = useCallback(() => {
        console.log(">>> Triggering confetti!")
        const duration = 5000 // ms
        const animationEnd = Date.now() + duration
        const defaults = { spread: 70, origin: { y: 0.6 } }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()
            if (timeLeft <= 0) {
                clearInterval(interval)
                return
            }
            confetti({
                ...defaults,
                particleCount: 200,
                origin: { x: 0.1, y: 0.6 },
            })
            confetti({
                ...defaults,
                particleCount: 200,
                origin: { x: 0.9, y: 0.6 },
            })
        }, 500)
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 2) Fetch Data & Poll
    // ─────────────────────────────────────────────────────────────────────────────
    const fetchOrderData = useCallback(
        async (isInitial: boolean) => {
            try {
                if (isInitial) {
                    setIsInitialLoading(true)
                    setErrorMessage("")
                } else {
                    setIsPolling(true)
                }

                const url =
                    `/api/orders?host=${encodeURIComponent(hostSlug)}&orderId=${encodeURIComponent(orderId)}`
                const res = await fetch(url, { cache: "no-store" })
                if (!res.ok) {
                    throw new Error(`Error fetching order: status ${res.status}`)
                }

                const data: Order = await res.json()
                console.log(">>> Fetched order. New status =", data.status)

                // Compare old vs. new
                const prevStatus = previousStatusRef.current
                console.log(">>> Previous status =", prevStatus)

                // If we are transitioning to 'completed' => confetti
                if (prevStatus !== "complete" && data.status === "complete") {
                    console.log(">>> Transition to COMPLETED => confetti!")
                    triggerConfetti()
                    // stopPolling() // optional, so we don’t keep polling forever
                }

                // Update state
                setOrder(data)
                previousStatusRef.current = data.status

                if (isInitial) {
                    setIsInitialLoading(false)
                } else {
                    setIsPolling(false)
                }
            } catch (err: any) {
                console.error(err)
                if (isInitial) {
                    setIsInitialLoading(false)
                } else {
                    setIsPolling(false)
                }
                setErrorMessage(err.message || "Could not find order.")
            }
        },
        [hostSlug, orderId, triggerConfetti]
    )

    const startPolling = useCallback(() => {
        if (pollingRef.current) return
        pollingRef.current = setInterval(() => {
            fetchOrderData(false)
        }, 5000)
    }, [fetchOrderData])

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) Kiosk Countdown
    // ─────────────────────────────────────────────────────────────────────────────
    const startCountdown = useCallback(() => {
        if (countdownRef.current) return
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!)
                    handleCreateNewOrderClick()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [])

    const stopCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) Lifecycle
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Initial fetch => store new status in ref
        fetchOrderData(true).then(() => {
            if (previousStatusRef.current !== "complete") {
                startPolling()
            }
        })

        if (kioskMode) {
            setTimeout(() => {
                startCountdown()
            }, 2000)
        }

        return () => {
            stopPolling()
            stopCountdown()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 5) Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    const handleCreateNewOrderClick = () => {
        if (kioskMode) {
            console.log("Redirect kiosk mode to /kioskindex")
        } else {
            console.log("Redirect to /")
        }
    }

    // Derive total paid
    const totalPaid = useMemo(() => {
        if (!order?.payments?.length) return 0
        return order.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    }, [order])

    // Decide which GIF to show
    const statusGif = useMemo(() => {
        if (!order) return null
        switch (order.status) {
            case "awaiting_preparation":
                return "/images/order_awaiting_preparation.gif"
            case "in_preparation":
                return "/images/order_preparing.gif"
            case "complete":
                return "/images/order_ready.gif"
            default:
                return null
        }
    }, [order])

    // Display daily “tempOrdNr” if available; fallback to `id`.
    const displayedOrderNumber = order?.tempOrdNr ?? order?.id

    // A textual label for statuses
    const readableStatus = useMemo(() => {
        if (!order) return ""
        switch (order.status) {
            case "pending_payment":
                return "Pending Payment"
            case "awaiting_preparation":
                return "Awaiting Preparation"
            case "in_preparation":
                return "In Preparation"
            case "complete":
                return "Completed"
            default:
                return order.status
        }
    }, [order])

    // Some instructions
    const isDelivery = order?.fulfillmentMethod === "delivery"
    const isTakeaway = order?.fulfillmentMethod === "takeaway"
    const isDineIn = order?.fulfillmentMethod === "dine_in"

    const instructionsText = useMemo(() => {
        if (isDelivery) return "Delivery instructions here..."
        if (isTakeaway) return "Please proceed to the takeaway counter."
        if (isDineIn) return "A staff member will bring your order to your table."
        return ""
    }, [isDelivery, isTakeaway, isDineIn])

    // ─────────────────────────────────────────────────────────────────────────────
    // 6) Render
    // ─────────────────────────────────────────────────────────────────────────────
    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-2xl font-semibold">Loading order summary...</p>
            </div>
        )
    }

    if (errorMessage) {
        return (
            <div className="text-center p-8 text-red-500">
                <h2 className="text-2xl font-bold mb-2">Error</h2>
                <p>{errorMessage}</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center p-8 text-gray-500">
                <p>No order data.</p>
            </div>
        )
    }

    // Our main UI
    const orderDetails = order.order_details || []

    return (
        <div
            className={
                kioskMode
                    ? "relative text-4xl w-full min-h-[600px] flex flex-col items-center"
                    : "relative text-base w-full min-h-[600px] flex flex-col items-center p-8 text-gray-800"
            }
        >
            {/* Show "Refreshing..." if we are poll-reloading */}
            {isPolling && (
                <div className="absolute top-2 right-2 bg-white/70 px-4 py-2 rounded shadow flex items-center gap-2 text-sm text-gray-600 z-50">
                    <svg
                        className="animate-spin -ml-1 mr-1 h-4 w-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.374 0 0 5.374 0 12h4z"
                        />
                    </svg>
                    Refreshing...
                </div>
            )}

            {/* Big status area + optional gif */}
            <div className="my-4 flex flex-col items-center gap-4">
                <div
                    className={`order-status-large relative text-3xl font-bold ${order.status === "complete" ? "order-completed" : "text-blue-600"
                        }`}
                >
                    {readableStatus}
                </div>
                {statusGif && (
                    <img
                        src={statusGif}
                        alt={`Order status: ${order.status}`}
                        className="w-[200px]"
                    />
                )}
            </div>

            {/* If not kiosk => show your fancy ticket with some 'tear line' styling */}
            {!kioskMode && (
                <div className="w-full max-w-md bg-white shadow-lg rounded-xl overflow-hidden relative">
                    {/* top color bar => red */}
                    <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                        <div className="font-bold text-lg uppercase tracking-wider">
                            Frituur Ticket
                        </div>
                        <div className="text-sm opacity-80">{hostSlug}</div>
                    </div>

                    {/* main body => order info */}
                    <div className="p-5 flex flex-col sm:flex-row items-center justify-between">
                        <div className="text-center sm:text-left">
                            <div className="text-2xl font-semibold mb-1">
                                Order #{displayedOrderNumber}
                            </div>
                            <div className="text-gray-500 text-sm">
                                {order.date_created || "No date"}
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 text-center sm:text-right">
                            {order.customer_note && (
                                <div className="text-xs text-gray-400 italic mt-1">
                                    Note: {order.customer_note}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* dashed "tear line" */}
                    <div className="relative">
                        <svg
                            className="text-gray-400 mx-auto"
                            width="100%"
                            height="20"
                            preserveAspectRatio="none"
                        >
                            <line
                                x1="0"
                                y1="10"
                                x2="100%"
                                y2="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="6,6"
                            />
                        </svg>
                    </div>

                    {/* bottom area => details + instructions + total */}
                    <div className="p-5 pt-3">
                        <div className="font-medium text-lg mb-2">Order Details</div>
                        {orderDetails.length < 1 ? (
                            <p className="text-gray-500 text-sm">No products in order.</p>
                        ) : (
                            <div className="space-y-3">
                                {orderDetails.map((detail) => (
                                    <div
                                        key={detail.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex-1 pr-2 font-semibold">
                                            {detail.product?.name_nl || "Unnamed Product"}
                                        </div>
                                        <div>x {detail.quantity}</div>
                                        <div className="ml-2 font-semibold">
                                            €{detail.price?.toFixed(2) ?? "--"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* instructions => e.g. "Takeaway instructions" */}
                        {instructionsText && (
                            <div className="mt-6 p-3 border border-dashed border-gray-300 rounded text-sm text-gray-600">
                                {instructionsText}
                            </div>
                        )}

                        {/* total area => sum of order.payments */}
                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end">
                            <span className="text-lg font-bold">
                                Total Paid: €{totalPaid.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* kiosk mode => big button with countdown */}
            {kioskMode ? (
                <button
                    id="newOrderButton"
                    onClick={handleCreateNewOrderClick}
                    className="bg-green-600 text-white px-8 py-4 mt-8 rounded"
                >
                    Create New Order ({countdown}s)
                </button>
            ) : (
                <button
                    onClick={handleCreateNewOrderClick}
                    className="bg-green-600 text-white px-4 py-2 mt-8 rounded"
                >
                    Create New Order
                </button>
            )}
        </div>
    )
}
