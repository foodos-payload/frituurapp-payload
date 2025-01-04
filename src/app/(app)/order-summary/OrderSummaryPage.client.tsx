"use client"

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react"
import confetti from "canvas-confetti"

// Example statuses you might have
type OrderStatus =
    | "pending_payment"
    | "awaiting_preparation"
    | "in_preparation"
    | "completed"
    | "cancelled"
// etc.

interface LineItem {
    id: number
    name: string
    product_id?: number
    quantity: number
    // etc...
    // Possibly an image to display
    image?: {
        src: string
    }
    total?: string
    meta_data?: Array<{
        id: number
        display_key: string
        display_value: string
    }>
}

interface Order {
    id: number
    status: OrderStatus
    date_created: string
    customer_note?: string
    line_items?: LineItem[]
    shipping_lines?: Array<{
        method_id: string
        instance_id: string
    }>
    discount_total?: string
    downloadable_items?: any[]
    // More fields as needed
}

interface OrderSummaryPageProps {
    orderId: string     // e.g. from the URL
    kioskMode?: boolean // detect from localStorage or props
}

export function OrderSummaryPage({ orderId, kioskMode }: OrderSummaryPageProps) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [countdown, setCountdown] = useState(30) // 30-second countdown for kiosk

    // We store the polling interval so we can clear it
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    // We store an interval for the kiosk countdown
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // For order-complete audio
    const orderCompletePlayCount = useRef(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // ─────────────────────────────────────────────────────────────────────────────
    // 1) Utility: trigger confetti multiple times
    // ─────────────────────────────────────────────────────────────────────────────
    const triggerConfetti = useCallback(() => {
        const duration = 5000 // 5 seconds
        const animationEnd = Date.now() + duration
        const defaults = { spread: 70, origin: { y: 0.6 } }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()
            if (timeLeft <= 0) {
                return clearInterval(interval)
            }
            // Fire bursts from left + right
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
    // 2) Utility: play order-complete sound
    // ─────────────────────────────────────────────────────────────────────────────
    const playCompletionSound = useCallback(() => {
        if (!audioRef.current) return
        // Limit # of times
        if (orderCompletePlayCount.current < 5) {
            audioRef.current.play().catch((err) => {
                console.error("Error playing completion sound:", err)
            })
            orderCompletePlayCount.current += 1
            // chain the playback
            audioRef.current.onended = () => {
                playCompletionSound()
            }
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 3) Function to fetch an order by ID (from your route, e.g. /api/order?orderId=xxx)
    // ─────────────────────────────────────────────────────────────────────────────
    const fetchOrderData = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage("")

        try {
            const url = `/api/order?orderId=${encodeURIComponent(orderId)}`
            const res = await fetch(url, { cache: "no-store" })
            if (!res.ok) {
                throw new Error(`Error fetching order: status ${res.status}`)
            }
            const data = (await res.json()) as Order

            // Check if status changed from not-completed => completed
            if (order && order.status !== "completed" && data.status === "completed") {
                // Trigger confetti & sound
                triggerConfetti()
                playCompletionSound()
                // If you want to stop polling after completion:
                stopPolling()
            }
            // Set new data
            setOrder(data)
            setIsLoading(false)
        } catch (err: any) {
            console.error(err)
            setIsLoading(false)
            setErrorMessage(err.message || "Could not find order.")
        }
    }, [orderId, order, triggerConfetti, playCompletionSound])

    // ─────────────────────────────────────────────────────────────────────────────
    // 4) Polling control: Start & Stop
    // ─────────────────────────────────────────────────────────────────────────────
    const startPolling = useCallback(() => {
        if (pollingRef.current) return // Already started
        pollingRef.current = setInterval(() => {
            fetchOrderData()
        }, 5000)
    }, [fetchOrderData])

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }, [])

    // ─────────────────────────────────────────────────────────────────────────────
    // 5) Kiosk countdown logic (if kiosk mode is true)
    // ─────────────────────────────────────────────────────────────────────────────
    const startCountdown = useCallback(() => {
        if (countdownRef.current) return
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current!)
                    // When it hits zero, do something:
                    // E.g. auto-navigate to /kiosk or “New Order”
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
    // 6) Called once on mount: fetch order, maybe start polling,
    //    set up audio, kiosk countdown, etc.
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Preload the audio
        audioRef.current = new Audio("/sounds/completion.mp3")
        audioRef.current.load()

        fetchOrderData().then(() => {
            // If order isn't completed => start polling
            if (order?.status !== "completed") {
                startPolling()
            }
        })

        // Only do countdown if kioskMode is true
        if (kioskMode) {
            // Start after 2 seconds
            setTimeout(() => {
                startCountdown()
            }, 2000)
        }

        // Cleanup on unmount
        return () => {
            stopPolling()
            stopCountdown()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // If order changes from not-completed to completed in same render cycle, handle? 
    // We rely on poll logic & fetch check above.

    // ─────────────────────────────────────────────────────────────────────────────
    // 7) “Create New Order” click
    // ─────────────────────────────────────────────────────────────────────────────
    const handleCreateNewOrderClick = () => {
        // E.g. navigate away
        if (kioskMode) {
            // e.g. window.location.href = "/kioskindex"
            console.log("Redirect kiosk mode to /kioskindex")
        } else {
            // e.g. router.push("/")
            console.log("Redirect to /")
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 8) Helper isDelivery/isTakeaway/isDineIn
    // ─────────────────────────────────────────────────────────────────────────────
    const isDelivery = useMemo(() => {
        const shipping = order?.shipping_lines?.[0]
        return shipping?.method_id === "free_shipping" && shipping?.instance_id === "1"
    }, [order])

    const isTakeaway = useMemo(() => {
        const shipping = order?.shipping_lines?.[0]
        return (
            shipping?.method_id === "pickup_location" && shipping?.instance_id === "0"
        )
    }, [order])

    const isDineIn = useMemo(() => {
        const shipping = order?.shipping_lines?.[0]
        return (
            shipping?.method_id === "free_shipping" && shipping?.instance_id === "2"
        )
    }, [order])

    // ─────────────────────────────────────────────────────────────────────────────
    // 9) Render the big layout
    // ─────────────────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <p>Loading order summary...</p>
            </div>
        )
    }
    if (errorMessage) {
        return (
            <div className="text-center p-8 text-red-500">
                <h2>Error</h2>
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

    // Extract or compute final data for display
    // e.g. filter out "dummy product" items
    const DUMMY_PRODUCT_ID = 1114
    const filteredLineItems = order.line_items?.filter(
        (item) => item.product_id !== DUMMY_PRODUCT_ID
    ) || []

    // Some label for status
    const readableStatus = (() => {
        switch (order.status) {
            case "pending_payment":
                return "Pending Payment"
            case "awaiting_preparation":
                return "Awaiting Preparation"
            case "in_preparation":
                return "In Preparation"
            case "completed":
                return "Completed"
            default:
                return order.status
        }
    })()

    return (
        <div
            className={
                kioskMode
                    ? "text-4xl w-full min-h-[600px] flex flex-col items-center"
                    : "text-base w-full min-h-[600px] flex flex-col items-center p-8"
            }
        >
            {/* KioskAppHeaderHome or normal header */}
            {kioskMode && (
                <div className="w-full mb-8">
                    {/* <KioskAppHeaderHome ... /> */}
                    <h2 className="text-center text-3xl font-bold">Kiosk Header</h2>
                </div>
            )}

            {/* Order number big text if kiosk */}
            {kioskMode && (
                <div className="mt-4 mb-8">
                    <div className="w-[250px] h-[250px] bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-6xl font-bold">
                        #{order.id}
                    </div>
                </div>
            )}

            {/* Status with ring or confetti, etc. */}
            <div className="my-4 flex flex-col items-center gap-4">
                <div className="order-status-large relative text-3xl font-bold text-blue-600">
                    {readableStatus}
                    {/* 
            If order.status==="completed" => add class .order-completed 
            Or do some ring effect 
          */}
                </div>
                {/* Possibly an image for each status */}
                {order.status === "in_preparation" && (
                    <img
                        src="/images/order_preparing.gif"
                        alt="Order is being prepared"
                        className="w-[200px]"
                    />
                )}
                {order.status === "completed" && (
                    <img
                        src="/images/order_ready.gif"
                        alt="Order is completed"
                        className="w-[200px]"
                    />
                )}

                {/* Maybe instructions if it's in "awaiting_preparation" */}
                {order.status === "awaiting_preparation" && (
                    <div className="mt-4 text-xl text-gray-600">
                        We received your order and will start preparing soon!
                    </div>
                )}
            </div>

            {/* If not kioskMode, show line items, totals, etc. */}
            {!kioskMode && (
                <div className="w-full max-w-3xl mt-8 p-4 bg-white shadow rounded">
                    <div className="flex flex-col gap-3">
                        <div>
                            <strong>Order #:</strong> {order.id}
                        </div>
                        <div>
                            <strong>Date Created:</strong> {order.date_created}
                        </div>
                        <div>
                            <strong>Customer Note:</strong> {order.customer_note || "(none)"}
                        </div>
                    </div>
                    <hr className="my-4" />
                    <div className="grid gap-4">
                        {filteredLineItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-4"
                            >
                                {/* image */}
                                <img
                                    src={item.image?.src || "/images/placeholder.png"}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    {item.meta_data?.map((meta) => {
                                        if (!meta.display_key.startsWith("_pao_")) {
                                            return (
                                                <div key={meta.id}>
                                                    <strong>{meta.display_key}: </strong>
                                                    {meta.display_value}
                                                </div>
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                                <div>x {item.quantity}</div>
                                <div className="font-semibold">
                                    {/* Format price if needed */}
                                    €{item.total}
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr className="my-4" />
                    {/* Possibly shipping lines, discount, total, etc. */}
                </div>
            )}

            {/* "New Order" button */}
            {kioskMode ? (
                <button
                    id="newOrderButton"
                    onClick={handleCreateNewOrderClick}
                    className="bg-green-600 text-white px-8 py-4 mt-8"
                >
                    Create New Order ({countdown}s)
                </button>
            ) : (
                <button
                    onClick={handleCreateNewOrderClick}
                    className="bg-green-600 text-white px-4 py-2 mt-8"
                >
                    Create New Order
                </button>
            )}

            {/* For kiosk, maybe show a small text about shipping lines */}
            {kioskMode && (
                <div className="mt-8 text-2xl">
                    {isDelivery && "Delivery instructions here..."}
                    {isTakeaway && "Takeaway instructions here..."}
                    {isDineIn && "Dine-in instructions here..."}
                </div>
            )}
        </div>
    )
}
